// Layer 2 - Agentforce Agent API.
// Talk to a Salesforce AI agent over plain REST, no Salesforce UI involved.
//
// Flow:
//   1. POST /einstein/ai-agent/v1/agents/{agentId}/sessions   -> sessionId
//   2. POST /einstein/ai-agent/v1/sessions/{sessionId}/messages
//   3. DELETE /einstein/ai-agent/v1/sessions/{sessionId}      (end)

import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { getAccessToken, sfFetch } from "./auth.js";

interface Session {
  sessionId: string;
  sequence: number;
}

// Map our frontend conversationId -> live Agent API session.
const sessions = new Map<string, Session>();

async function startSession(): Promise<Session> {
  if (!config.agent.id) {
    throw new Error("SF_AGENT_ID is not set. Build an agent in Agentforce Builder and copy its Id.");
  }
  const token = await getAccessToken();
  const res = await sfFetch(
    `/einstein/ai-agent/v1/agents/${config.agent.id}/sessions`,
    {
      method: "POST",
      body: JSON.stringify({
        externalSessionKey: randomUUID(),
        instanceConfig: { endpoint: token.instanceUrl },
        streamingCapabilities: { chunkTypes: ["Text"] },
        bypassUser: true,
      }),
    },
    config.agent.apiBase
  );
  if (!res.ok) {
    throw new Error(`Agent session start failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { sessionId: string };
  return { sessionId: data.sessionId, sequence: 0 };
}

async function ensureSession(conversationId: string): Promise<Session> {
  let session = sessions.get(conversationId);
  if (!session) {
    session = await startSession();
    sessions.set(conversationId, session);
  }
  return session;
}

export interface AgentReply {
  text: string;
  sessionId: string;
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<AgentReply> {
  const session = await ensureSession(conversationId);
  session.sequence += 1;

  const res = await sfFetch(
    `/einstein/ai-agent/v1/sessions/${session.sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        message: { sequenceId: session.sequence, type: "Text", text },
      }),
    },
    config.agent.apiBase
  );
  if (!res.ok) {
    throw new Error(`Agent message failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as {
    messages?: Array<{ message?: string; text?: string }>;
  };
  const reply =
    data.messages?.map((m) => m.message ?? m.text ?? "").join("\n").trim() ||
    "(the agent returned no text)";

  return { text: reply, sessionId: session.sessionId };
}

export async function endSession(conversationId: string): Promise<void> {
  const session = sessions.get(conversationId);
  if (!session) return;
  sessions.delete(conversationId);
  try {
    await sfFetch(
      `/einstein/ai-agent/v1/sessions/${session.sessionId}`,
      { method: "DELETE", headers: { "x-session-end-reason": "UserRequest" } },
      config.agent.apiBase
    );
  } catch {
    // Best-effort cleanup; the session will also time out server-side.
  }
}
