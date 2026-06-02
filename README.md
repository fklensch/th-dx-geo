# Salesforce Headless 360 — Hotel Account Concierge

A small demo of Salesforce’s **Headless 360** idea: *the entire platform is an
API — no browser required.* One tiny app shows three headless surfaces working
together.

| Layer | Surface | What it does |
|---|---|---|
| 1 | **CRM Data REST API** | Headless read/create of Account records over OAuth |
| 2 | **Agentforce Agent API** | Chat with a Salesforce AI agent over plain REST — no Salesforce UI |
| 3 | **`@salesforce/mcp`** | Wire the same org into an AI coding agent (Claude Code / Cursor) |

The backend is the “headless client”: it authenticates **server-to-server**
with the OAuth client-credentials flow (no redirect, no browser) and exposes the
CRM data and the agent to a minimal split-view UI.

```
 Browser UI ──► Node/Express backend ──OAuth client-credentials──► Salesforce org
 (data + chat)   (holds secrets,                                    • Data REST API
                  caches token)                                     • Agent API
```

## Quick start (mock mode — zero setup)

The app ships in **mock mode**, so you can see the full UI with no Salesforce org.

```bash
# Option A — Docker (recommended)
cp app/.env.example app/.env        # defaults to MOCK_MODE=true
docker compose up --build           # → http://localhost:3000

# Option B — Node 20+ locally
cd app
cp .env.example .env
npm install
npm run build && npm start          # → http://localhost:3000
```

You’ll get a hotel CRM panel and an agent chat, both served from canned data.

## Go live against a real (free) org

Flip to live mode by connecting a **free Agentforce Developer Edition** org:

1. Sign up for the org.
2. Create an **External Client App** (OAuth client credentials) → consumer key/secret.
3. (Optional) Deploy the geolocation field + load sample hotels (`salesforce/`).
4. Build & activate an agent in **Agentforce Builder** → copy its Id.
5. Fill in `app/.env` (`MOCK_MODE=false`, login URL, key/secret, agent id) and rerun.

Full step-by-step: **[docs/SETUP.md](docs/SETUP.md)**. Everything is **$0**.

## Where it runs

- **Local Docker** — `docker compose up` → free. The default.
- **Cloud** — the same container deploys to any hobby/free tier (Render, Fly.io,
  Railway) when you want a shareable URL.

## Project layout

```
app/         Node/TypeScript backend + minimal UI (the headless client)
salesforce/  Slim SFDX project — geolocation field + sample hotel data
mcp/         @salesforce/mcp config to wire the org into Claude Code (Layer 3)
docs/        SETUP.md — org, External Client App, and agent setup
```

## Security

Secrets live only in `app/.env` (git-ignored) and never reach the browser. The
backend is the only thing that holds the consumer key/secret and the token.
