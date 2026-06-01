// REST routes for Layer 2 (Agentforce Agent API).

import { Router } from "express";
import { config } from "../config.js";
import { sendMessage, endSession } from "../salesforce/agent.js";
import { mockAgentReply } from "../mock.js";

export const agentRouter = Router();

agentRouter.post("/message", async (req, res) => {
  const { text, conversationId } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "text is required." });
  }
  const convo = typeof conversationId === "string" && conversationId ? conversationId : "default";
  try {
    if (config.mockMode) {
      return res.json({ mock: true, reply: mockAgentReply(text) });
    }
    const reply = await sendMessage(convo, text);
    res.json({ mock: false, reply: reply.text, sessionId: reply.sessionId });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

agentRouter.post("/reset", async (req, res) => {
  const convo =
    typeof req.body?.conversationId === "string" && req.body.conversationId
      ? req.body.conversationId
      : "default";
  if (!config.mockMode) await endSession(convo);
  res.json({ ok: true });
});
