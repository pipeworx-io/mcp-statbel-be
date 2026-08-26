# mcp-statbel-be

Statbel — Statistics Belgium (be.STAT / bestat) open data MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_views` | Browse/search Statbel (Statistics Belgium, be.STAT) saved statistical views. Each view is a pre-built table over a dataset and carries a single locale (nl/fr/de/en). Returns id, name, locale, dataSourceId and publish dates. Filter by case-insensitive substring of the view name (matches in any language). |
| `get_view` | Metadata for one Statbel view by its id (a UUID, e.g. from list_views). Returns the view object: name, locale, dataSourceId (the underlying dataset), and publish/change dates. To get the dataset description in all available languages, pass the returned dataSourceId to get_dataset. |
| `list_datasets` | Browse/search Statbel datasets (be.STAT "datasources"). Each dataset has a `name` code (e.g. "IM_EAF_HOUSE_SALES_IDX"), a `descriptions` map with one entry per supported language (nl/fr/de/en), a category id, supportedLocales, and last-update timestamps. Filter by case-insensitive substring matched against the dataset code and all-language descriptions. |
| `get_dataset` | Multilingual metadata for one Statbel dataset by its id (a UUID, e.g. the dataSourceId from a view). Returns the dataset code `name`, the `descriptions` map (nl/fr/de/en text), supportedLocales, defaultLocale, category id and update dates. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "statbel-be": {
      "url": "https://gateway.pipeworx.io/statbel-be/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/statbel-be/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Statbel Be data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
