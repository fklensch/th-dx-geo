# Setup — connecting the demo to a real Salesforce org

The app runs immediately in **mock mode** with zero setup. Follow this guide to
flip it to **live mode** against a free Salesforce org. Everything here is $0.

---

## 1. Pick your org: Developer Edition **or** a sandbox

You can point the demo at either kind of org. The only differences are the
**login host** and the **`SF_LOGIN_URL`** value — see the table below.

### Option A — free Agentforce Developer Edition (greenfield)

Sign up at the Salesforce developer portal for a **Developer Edition** org. As
of the April 2026 refresh, free Dev Edition orgs include Agentforce, the Agent
API, Data 360, and Salesforce-hosted MCP servers (with monthly usage caps).

After signup, set up **My Domain** (Setup → My Domain) if not already done.

### Option B — a sandbox (copy of an existing org)

A sandbox is the right choice if you want to demo against real data/config from
an existing org. Sandboxes live on the **`test.salesforce.com`** login host and
have a My Domain URL with a `--<SandboxName>` suffix. Note that an External
Client App (step 2) and an agent (step 4) created in production **do** carry
into a newly refreshed sandbox, but the **consumer secret must be re-generated
inside the sandbox**, and agents must be re-activated there.

### Which login host / `SF_LOGIN_URL` do I use?

| Org type | `sf org login web` host | `SF_LOGIN_URL` in `.env` |
|---|---|---|
| Production / Dev Edition | `https://login.salesforce.com` (default) | `https://your-domain.my.salesforce.com` |
| **Sandbox** | `https://test.salesforce.com` | `https://your-domain--sandboxname.sandbox.my.salesforce.com` |

> The exact My Domain URL is shown in the sandbox under **Setup → My Domain**,
> and in the browser address bar after you log in. The app sends the token
> request to `${SF_LOGIN_URL}/services/oauth2/token` and then uses whatever
> `instance_url` the org returns, so getting `SF_LOGIN_URL` right is all that
> matters.

---

## 2. Create an External Client App (OAuth client credentials)

This is the headless auth surface — pure OAuth plumbing, no UI.

1. **Setup → App Manager → New External Client App** (or *External Client Apps*).
2. Basic info: name it e.g. `Headless Concierge`, add a contact email.
3. **Enable OAuth**. Set a placeholder callback URL (e.g.
   `https://login.salesforce.com/services/oauth2/callback`) — it’s unused by the
   client-credentials flow but the form requires one.
4. **Scopes**: add `Manage user data via APIs (api)` and
   `Perform requests at any time (refresh_token, offline_access)`.
5. Save, then in the app’s **OAuth settings / policies**:
   - Enable the **Client Credentials Flow**.
   - Set the **Run As / execution user** to your user (or a dedicated
     integration user). The flow runs as this user.
6. Copy the **Consumer Key** → `SF_CLIENT_ID` and **Consumer Secret** →
   `SF_CLIENT_SECRET`.

> If token calls return `invalid_client` or `inactive`, wait a few minutes —
> new client-credentials apps can take time to propagate.

---

## 3. (Optional) Deploy the geolocation field + load sample hotels

```bash
cd salesforce

# Dev Edition / production org (default login host):
sf org login web --alias headless-demo --set-default

# --- OR --- a sandbox (note the test.salesforce.com instance URL):
sf org login web --alias headless-demo --set-default \
  --instance-url https://test.salesforce.com

sf project deploy start --source-dir force-app
sf data import tree --files data/Account.json
```

The app works without this (it queries whatever Accounts exist), but this gives
you on-theme hotel data.

---

## 4. Build the Agentforce agent (Layer 2)

1. **Setup → Agentforce / Agents → New Agent** (Agentforce Builder).
2. Start from a template or blank; give it instructions like:
   *“You are a hotel account concierge. Help reps look up, summarize, and create
   hotel Accounts.”*
3. Add/keep topics that can query and create **Account** records (standard CRM
   actions), so the agent can act on the same data the app shows.
4. **Activate** the agent.
5. Copy the **Agent (Bot) Id** (18 chars) → `SF_AGENT_ID`.

---

## 5. Configure `.env` and go live

```bash
cd app
cp .env.example .env
# edit .env:
#   MOCK_MODE=false
#   SF_LOGIN_URL=...        # Dev/prod: https://your-domain.my.salesforce.com
#                           # Sandbox:  https://your-domain--sandboxname.sandbox.my.salesforce.com
#   SF_CLIENT_ID=...        # Consumer Key
#   SF_CLIENT_SECRET=...    # Consumer Secret  (re-generate inside the sandbox!)
#   SF_AGENT_ID=...         # Agent (Bot) Id
```

Then run it (see ../README.md): `docker compose up --build` →
http://localhost:3000. The badge should read **LIVE**.

---

## 6. (Optional) Layer 3 — MCP

See `../mcp/README.md` to wire the same org into Claude Code / Cursor.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Badge stuck on MOCK | `MOCK_MODE` not `false`, or `SF_CLIENT_ID` empty |
| `OAuth token request failed (400)` | Client Credentials Flow not enabled, or no run-as user |
| `Account query failed (401)` | Execution user lacks API access / permissions |
| `Agent session start failed (404)` | Wrong `SF_AGENT_ID` or agent not activated |
| Agent replies but no data changes | Agent has no Account create/query actions/topics |
