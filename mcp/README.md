# Layer 3 — `@salesforce/mcp` (the developer-facing headless surface)

Headless 360's other half: instead of *your* app calling Salesforce, an **AI
coding agent** (Claude Code, Cursor, Codex, Windsurf…) talks to your org live
through the Model Context Protocol. Same org, same headless idea, no browser.

## Prerequisites

1. Salesforce CLI installed (`sf`) and an authorized org:
   ```bash
   sf org login web --alias headless-demo --set-default
   ```
2. Node.js 20+ (the MCP server runs via `npx`).

## Wire it into Claude Code

Copy `mcp.sample.json` to your Claude Code MCP config (e.g. project-level
`.mcp.json`, or your global `~/.claude.json` `mcpServers` block):

```bash
cp mcp/mcp.sample.json .mcp.json
```

`--orgs DEFAULT_TARGET_ORG` tells the server to use whichever org you set as
default with `sf`. `--toolsets all` exposes the full set (SOQL, Apex, metadata,
Agentforce, etc.); narrow it for a tighter surface.

Restart Claude Code and you can ask things like:

> “Using the salesforce MCP server, list hospitality Accounts and draft an Apex
> class that returns the nearest hotel to a given lat/long.”

## Notes

- The free Developer Edition includes Salesforce-hosted MCP servers and Vibes,
  with monthly usage caps. See ../docs/SETUP.md for the org.
- Flags and toolset names evolve — check `npx @salesforce/mcp --help` and the
  official docs if a toolset isn’t found.
