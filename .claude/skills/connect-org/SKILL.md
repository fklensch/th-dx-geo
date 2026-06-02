---
name: connect-org
description: Connect this demo to a real Salesforce org and flip it from mock to live mode. Use when the user has a Salesforce org (or just signed up for a free Agentforce Developer Edition) and wants to deploy the geolocation field, load sample hotel data, and configure app/.env so the headless concierge talks to live CRM + the Agentforce Agent API. Wraps the sf CLI steps from docs/SETUP.md.
---

# Connect the concierge to a real Salesforce org

Goal: take the app from **mock mode** to **LIVE** against a real org. Full
manual reference is `docs/SETUP.md`; this skill drives the CLI-automatable parts
and tells the user exactly which clicks remain.

## Preconditions to confirm with the user
- They have an org (free Agentforce Developer Edition is fine) with **My Domain** set.
- The `sf` CLI is installed (`sf --version`). If not, install `@salesforce/cli`.

## Steps

### 1. Authorize the org
```bash
sf org login web --alias headless-demo --set-default
sf org display --target-org headless-demo   # confirm connection
```

### 2. Deploy the geolocation field + load sample hotels
```bash
cd salesforce
sf project deploy start --source-dir force-app --target-org headless-demo
sf data import tree --files data/Account.json --target-org headless-demo
```
The app works without this (it lists whatever Accounts exist), but this gives
on-theme hotel data.

### 3. External Client App — MANUAL (no CLI path)
Tell the user to do this in Setup (see docs/SETUP.md §2):
- Create an External Client App, enable OAuth + the **Client Credentials Flow**,
  set a run-as execution user, scopes `api` + `refresh_token`.
- Copy the **Consumer Key** and **Consumer Secret**.

### 4. Agentforce agent — MANUAL (Agentforce Builder)
- Build + **activate** an agent with Account query/create actions (docs §4).
- Copy the **Agent (Bot) Id** (18 chars).

### 5. Fill in app/.env and go live
Help the user set in `app/.env`:
```
MOCK_MODE=false
SF_LOGIN_URL=https://<their-domain>.my.salesforce.com
SF_CLIENT_ID=<Consumer Key>
SF_CLIENT_SECRET=<Consumer Secret>
SF_AGENT_ID=<Agent Bot Id>
```

### 6. Verify
```bash
cd app && npm run build && PORT=3000 node dist/index.js &
sleep 2
curl -s localhost:3000/api/status      # expect "mock": false
curl -s localhost:3000/api/accounts    # expect "mock": false + real records
pkill -f "node dist/index.js"
```
If `/api/status` still shows `mock: true`, MOCK_MODE isn't false or SF_CLIENT_ID
is empty. For 400/401/404 errors, see the troubleshooting table in docs/SETUP.md.

## Tip: use the salesforce MCP server instead of the CLI
Once the org is authorized (step 1), the `salesforce` MCP server (.mcp.json) can
do steps 2 (deploy/import) and inspect the agent directly from chat — prefer it
when available.
