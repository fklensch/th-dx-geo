// OAuth 2.0 Client Credentials flow - the headless, server-to-server auth at
// the heart of this demo. No browser, no redirect: the backend exchanges its
// consumer key/secret for an access token and caches it until it expires.

import { config } from "../config.js";

interface TokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at?: string;
}

interface CachedToken {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number; // epoch ms
}

let cached: CachedToken | null = null;

// Salesforce client-credentials tokens don't return expires_in; they live for
// the org's session timeout. We refresh well before that and also on any 401.
const TOKEN_TTL_MS = 90 * 60 * 1000; // 90 minutes

export async function getAccessToken(forceRefresh = false): Promise<CachedToken> {
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  const { loginUrl, clientId, clientSecret } = config.salesforce;
  if (!loginUrl || !clientId || !clientSecret) {
    throw new Error(
      "Salesforce credentials are not configured. Set SF_LOGIN_URL, SF_CLIENT_ID and SF_CLIENT_SECRET in .env (or leave MOCK_MODE=true)."
    );
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OAuth token request failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as TokenResponse;
  cached = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url.replace(/\/+$/, ""),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return cached;
}

// Helper that performs an authenticated fetch and transparently refreshes the
// token once if the org rejects it (401).
export async function sfFetch(
  path: string,
  init: RequestInit = {},
  baseOverride?: string
): Promise<Response> {
  let token = await getAccessToken();
  const url = (baseOverride ?? token.instanceUrl) + path;

  const doFetch = (accessToken: string) =>
    fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

  let res = await doFetch(token.accessToken);
  if (res.status === 401) {
    token = await getAccessToken(true);
    res = await doFetch(token.accessToken);
  }
  return res;
}
