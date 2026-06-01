interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Statbel — Statistics Belgium (be.STAT / bestat) open data MCP.
 *
 * Keyless REST API at https://bestat.statbel.fgov.be/bestat/api .
 *
 * Belgium is multilingual: dataset descriptions are published per language
 * (nl/fr/de/en) and individual "views" each carry a single `locale`. Field
 * values therefore arrive in Dutch, French, German, or English depending on
 * the view/dataset — there is no single canonical language. The `descriptions`
 * map on a dataset exposes whichever locales that dataset supports.
 *
 * Verified live (curl, 2026-06) — clean JSON endpoints this pack uses:
 *   GET /views               -> array of ~1341 saved views (id, name, locale, dataSourceId, dates)
 *   GET /views/{id}          -> a single view's metadata object
 *   GET /datasources         -> array of ~182 datasets (multilingual `descriptions`, dataset `name` code, category, update dates)
 *   GET /datasources/{id}    -> a single dataset's multilingual metadata
 *
 * Honest limitation discovered during probing: be.STAT serves the actual
 * observation/result data only through its server-side JSF/PrimeFaces "cube"
 * viewer, not a clean REST endpoint. Every data-bearing sub-path tried
 * (/views/{id}/result, /views/{id}/data, /views/{id}/facets,
 * /datasources/{id}/result, /categories, GET and POST with assorted bodies)
 * returns a body-less HTTP 500. So this pack exposes the discoverable
 * catalogue/metadata layer (views + datasets), which is what the API actually
 * serves as JSON; it does not return raw observations.
 */


const BASE = 'https://bestat.statbel.fgov.be/bestat/api';
const UA = 'pipeworx-mcp-statbel-be/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_views',
    description:
      'Browse/search Statbel (Statistics Belgium, be.STAT) saved statistical views. ' +
      'Each view is a pre-built table over a dataset and carries a single locale (nl/fr/de/en). ' +
      'Returns id, name, locale, dataSourceId and publish dates. ' +
      'Filter by case-insensitive substring of the view name (matches in any language).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Case-insensitive substring to match in the view name (any language). Omit to list all.' },
        locale: { type: 'string', description: 'Optional filter to one language: "nl", "fr", "de" or "en".' },
        limit: { type: 'number', description: 'Max results to return (default 50, max 500).' },
      },
    },
  },
  {
    name: 'get_view',
    description:
      'Metadata for one Statbel view by its id (a UUID, e.g. from list_views). ' +
      'Returns the view object: name, locale, dataSourceId (the underlying dataset), and publish/change dates. ' +
      'To get the dataset description in all available languages, pass the returned dataSourceId to get_dataset.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'View UUID, e.g. "1be9b77f-4005-4d58-a885-8281b5bbe617".' } },
      required: ['id'],
    },
  },
  {
    name: 'list_datasets',
    description:
      'Browse/search Statbel datasets (be.STAT "datasources"). ' +
      'Each dataset has a `name` code (e.g. "IM_EAF_HOUSE_SALES_IDX"), a `descriptions` map with one entry per supported language (nl/fr/de/en), ' +
      'a category id, supportedLocales, and last-update timestamps. ' +
      'Filter by case-insensitive substring matched against the dataset code and all-language descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Case-insensitive substring matched against the dataset code and any-language description. Omit to list all.' },
        limit: { type: 'number', description: 'Max results to return (default 50, max 500).' },
      },
    },
  },
  {
    name: 'get_dataset',
    description:
      'Multilingual metadata for one Statbel dataset by its id (a UUID, e.g. the dataSourceId from a view). ' +
      'Returns the dataset code `name`, the `descriptions` map (nl/fr/de/en text), supportedLocales, defaultLocale, category id and update dates.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Dataset (datasource) UUID, e.g. "89cf1b74-dc88-4a76-a215-a25dffed7f37".' } },
      required: ['id'],
    },
  },
];

interface View {
  id: string;
  name: string;
  locale: string;
  [k: string]: unknown;
}

interface Dataset {
  id: string;
  name: string;
  descriptions?: Record<string, string>;
  [k: string]: unknown;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'list_views': {
      const query = (args.query as string | undefined)?.trim().toLowerCase();
      const locale = (args.locale as string | undefined)?.trim().toLowerCase();
      const limit = clampLimit(args.limit);
      const views = (await statbelGet('/views')) as View[];
      let out = views;
      if (locale) out = out.filter((v) => (v.locale ?? '').toLowerCase() === locale);
      if (query) out = out.filter((v) => (v.name ?? '').toLowerCase().includes(query));
      return { total: out.length, returned: Math.min(out.length, limit), views: out.slice(0, limit) };
    }
    case 'get_view':
      return statbelGet(`/views/${encodeURIComponent(reqStr(args, 'id', '"1be9b77f-4005-4d58-a885-8281b5bbe617"'))}`);
    case 'list_datasets': {
      const query = (args.query as string | undefined)?.trim().toLowerCase();
      const limit = clampLimit(args.limit);
      const datasets = (await statbelGet('/datasources')) as Dataset[];
      let out = datasets;
      if (query) {
        out = out.filter((d) => {
          if ((d.name ?? '').toLowerCase().includes(query)) return true;
          const descs = d.descriptions ?? {};
          return Object.values(descs).some((t) => (t ?? '').toLowerCase().includes(query));
        });
      }
      return { total: out.length, returned: Math.min(out.length, limit), datasets: out.slice(0, limit) };
    }
    case 'get_dataset':
      return statbelGet(`/datasources/${encodeURIComponent(reqStr(args, 'id', '"89cf1b74-dc88-4a76-a215-a25dffed7f37"'))}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function statbelGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Statbel: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function clampLimit(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 50;
  return Math.min(Math.max(n, 1), 500);
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
