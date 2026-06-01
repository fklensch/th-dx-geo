// Salesforce Headless 360 demo - "hotel account concierge".
// A tiny Express backend that is the headless client: it authenticates to
// Salesforce server-to-server (OAuth client credentials) and exposes the CRM
// Data REST API (layer 1) and the Agentforce Agent API (layer 2) to a small UI.

import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "./config.js";
import { accountsRouter } from "./routes/accounts.js";
import { agentRouter } from "./routes/agent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Health + which headless surfaces are active (shown in the UI footer).
app.get("/api/status", (_req, res) => {
  res.json({
    mock: config.mockMode,
    loginUrl: config.salesforce.loginUrl || null,
    agentConfigured: Boolean(config.agent.id),
    apiVersion: config.salesforce.apiVersion,
  });
});

app.use("/api/accounts", accountsRouter);
app.use("/api/agent", agentRouter);

// Static UI
app.use(express.static(join(__dirname, "..", "public")));

app.listen(config.port, () => {
  const mode = config.mockMode ? "MOCK (no org connected)" : "LIVE (Salesforce connected)";
  console.log(`Headless concierge listening on http://localhost:${config.port}  [${mode}]`);
});
