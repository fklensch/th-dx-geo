// Centralized configuration read from environment variables.
// See app/.env.example for documentation of each value.

function env(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

const clientId = env("SF_CLIENT_ID");

export const config = {
  port: Number(env("PORT", "3000")),

  // Mock mode is on when explicitly requested OR when no credentials exist,
  // so the UI is always demoable even before an org is connected.
  mockMode: env("MOCK_MODE", "true").toLowerCase() === "true" || clientId === "",

  salesforce: {
    loginUrl: env("SF_LOGIN_URL").replace(/\/+$/, ""),
    clientId,
    clientSecret: env("SF_CLIENT_SECRET"),
    apiVersion: env("SF_API_VERSION", "64.0"),
  },

  agent: {
    id: env("SF_AGENT_ID"),
    apiBase: env("SF_AGENT_API_BASE", "https://api.salesforce.com").replace(/\/+$/, ""),
  },
};

export type AppConfig = typeof config;
