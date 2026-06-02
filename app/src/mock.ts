// Canned responses so the UI is fully demoable WITHOUT a Salesforce org.
// Active whenever MOCK_MODE=true or no SF_CLIENT_ID is configured.

import type { HotelAccount } from "./salesforce/data.js";

export const mockHotels: HotelAccount[] = [
  {
    Id: "001MOCK0000000001",
    Name: "Hilton Union Square",
    Phone: "+1 415-771-1400",
    Website: "https://hilton.com",
    Industry: "Hospitality",
    BillingCity: "San Francisco",
    Description: "333 O'Farrell St - flagship downtown property.",
  },
  {
    Id: "001MOCK0000000002",
    Name: "Hyatt Regency SF",
    Phone: "+1 415-788-1234",
    Website: "https://hyatt.com",
    Industry: "Hospitality",
    BillingCity: "San Francisco",
    Description: "5 Embarcadero Center - waterfront atrium hotel.",
  },
  {
    Id: "001MOCK0000000003",
    Name: "Marriott Marquis",
    Phone: "+1 415-896-1600",
    Website: "https://marriott.com",
    Industry: "Hospitality",
    BillingCity: "San Francisco",
    Description: "780 Mission St - near Moscone Center.",
  },
];

export function mockAgentReply(text: string): string {
  return (
    `(mock agent) You said: "${text}". ` +
    `Connect a real Agentforce agent by setting SF_AGENT_ID and MOCK_MODE=false ` +
    `in app/.env, then I'll answer from live CRM data.`
  );
}
