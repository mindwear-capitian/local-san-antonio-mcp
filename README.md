# Local San Antonio MCP

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-stdio-purple)](https://modelcontextprotocol.io/)

> **Your AI's local guide to San Antonio.** A Model Context Protocol (MCP) server giving Claude (and any MCP client) plain-English access to official San Antonio-area public data — no API keys, no logins.

**License:** Open source under **[Apache License 2.0](LICENSE)** — free to use, modify, and build on, including commercially. Please keep the [NOTICE](NOTICE) attribution when you redistribute.
**Built by:** [Ed Neuhaus](https://edneuhaus.com).
**Source:** https://github.com/mindwear-capitian/local-san-antonio-mcp
**Part of a family:** [local-city-mcp-template](https://github.com/mindwear-capitian/local-city-mcp-template) — the spec, the template, and the full list of cities built so far.

> 🚧 **Early-stage.** Three tools live today (weather alerts, school ratings, 311). More San Antonio/Bexar-area civic and property data planned — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Install

Add to your Claude Desktop config:

```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "local-san-antonio": {
      "command": "npx",
      "args": ["-y", "github:mindwear-capitian/local-san-antonio-mcp"]
    }
  }
}
```

Restart Claude Desktop. No API keys required for any tool.

### Claude Code

```bash
claude mcp add local-san-antonio npx -y github:mindwear-capitian/local-san-antonio-mcp
```

---

## Try it

- *"Is there an active weather alert for San Antonio right now?"*
- *"What's the TEA rating for San Antonio ISD?"*
- *"Show me A-rated elementary schools in Bexar county."*
- *"Any open animal services 311 calls in council district 1?"*

---

## Tools (3 live)

| Tool | What it does |
|------|--------------|
| `san_antonio_nws_alerts` | Active National Weather Service alerts (severe thunderstorm, tornado, flood, heat, freeze, fire weather) for a San Antonio location. Defaults to central San Antonio when no address given. |
| `san_antonio_tea_schools` | Texas Education Agency school lookup — A-F accountability ratings + AskTED campus directory (statewide dataset). Search by campus, district, county, or city. Example districts: San Antonio ISD, North East ISD, Northside ISD. |
| `san_antonio_311` | San Antonio 311 service calls (streets, animal services, code compliance, etc). Filter by category, type, department, status, or council district. |
| `about` | Version + capability summary. |

## Sources of Truth

| Domain | Source |
|--------|--------|
| Weather alerts | National Weather Service (api.weather.gov) |
| School ratings | Texas Education Agency Statewide Accountability Ratings 2022-2023 + AskTED directory (data.texas.gov) — statewide dataset, same source used by [local-austin-mcp](https://github.com/mindwear-capitian/local-austin-mcp) |
| 311 service calls | City of San Antonio Open Data (data.sanantonio.gov), via its ArcGIS Hub-hosted FeatureServer |
| Geocoding | U.S. Census geocoder |

## Architecture

Node.js (ES modules), `@modelcontextprotocol/sdk` over stdio. Built from [local-city-mcp-template](https://github.com/mindwear-capitian/local-city-mcp-template) — see that repo's `STANDARD.md` for the spec (hard rules, tool contract, testing bar, licensing pattern) this server follows. Every response includes a `source_url`.

## Contact

Built by [Ed Neuhaus](https://edneuhaus.com). Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
