---
name: run-concierge
description: Launch and verify this project's headless concierge app. Use when asked to run, start, serve, or screenshot the app, or to confirm a change works in the real app. This is a Node/TypeScript + Express app in app/ that serves a UI at http://localhost:3000 and defaults to mock mode (no Salesforce org required).
---

# Running the Hotel Account Concierge

This repo is the **Salesforce Headless 360** demo. The runnable app lives in
`app/` (Node 20 + Express + a static UI). It ships in **mock mode**, so it runs
end-to-end with no Salesforce org.

## Fastest way to run (local Node)

```bash
cd app
npm install        # if not already installed by the session-start hook
npm run build      # tsc -> dist/
PORT=3000 MOCK_MODE=true node dist/index.js
```

Then open http://localhost:3000 — a CRM data panel (left) and an Agentforce
chat panel (right). The footer badge shows MOCK vs LIVE.

## Run with Docker (matches deploy)

```bash
docker compose up --build      # from repo root -> http://localhost:3000
```

## Smoke-test the endpoints without a browser

```bash
curl -s localhost:3000/api/status
curl -s localhost:3000/api/accounts
curl -s -X POST localhost:3000/api/agent/message \
  -H 'Content-Type: application/json' -d '{"text":"hi"}'
```

## Going live (real org)

Mock mode needs no setup. To hit a real Salesforce org, follow
`docs/SETUP.md` (free Agentforce Dev org + External Client App + agent), fill
in `app/.env`, set `MOCK_MODE=false`, and rerun. When the org is connected, you
can also use the **`salesforce` MCP server** (see `.mcp.json` / `mcp/README.md`)
to query SOQL, deploy the `Location__c` field, load `salesforce/data/Account.json`,
and manage the agent directly.

## Notes

- Default port is 3000 (override with `PORT`).
- There is no test suite yet; `npm run build` (tsc) is the type-check gate.
- Always stop background servers you start (e.g. `pkill -f "node dist/index.js"`).
