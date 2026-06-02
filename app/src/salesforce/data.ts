// Layer 1 - CRM Data REST API.
// Headless read/write of Account records over the standard REST API.

import { config } from "../config.js";
import { getAccessToken, sfFetch } from "./auth.js";

export interface HotelAccount {
  Id?: string;
  Name: string;
  Phone?: string | null;
  Website?: string | null;
  Industry?: string | null;
  BillingCity?: string | null;
  Description?: string | null;
}

const FIELDS = "Id, Name, Phone, Website, Industry, BillingCity, Description";

// List accounts via SOQL. We prefer hospitality accounts (the concierge theme)
// but fall back to any account so the demo works on a fresh org.
export async function listAccounts(): Promise<HotelAccount[]> {
  const v = config.salesforce.apiVersion;
  const soql =
    `SELECT ${FIELDS} FROM Account ` +
    `ORDER BY LastModifiedDate DESC LIMIT 50`;
  const res = await sfFetch(
    `/services/data/v${v}/query?q=${encodeURIComponent(soql)}`
  );
  if (!res.ok) {
    throw new Error(`Account query failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { records: HotelAccount[] };
  return data.records;
}

// Create a new Account headlessly.
export async function createAccount(input: HotelAccount): Promise<{ id: string }> {
  const v = config.salesforce.apiVersion;
  const res = await sfFetch(`/services/data/v${v}/sobjects/Account`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Account create failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data;
}

// Surfaced in the UI footer so you can see which headless surface is live.
export async function whoami(): Promise<{ instanceUrl: string }> {
  const token = await getAccessToken();
  return { instanceUrl: token.instanceUrl };
}
