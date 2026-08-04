# mcp-statbel-be

Statbel — Statistics Belgium (be.STAT / bestat) open data MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Statbel Be data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
