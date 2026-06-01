// REST routes for Layer 1 (CRM Data REST API).

import { Router } from "express";
import { config } from "../config.js";
import { listAccounts, createAccount } from "../salesforce/data.js";
import { mockHotels } from "../mock.js";

export const accountsRouter = Router();

accountsRouter.get("/", async (_req, res) => {
  try {
    const accounts = config.mockMode ? mockHotels : await listAccounts();
    res.json({ mock: config.mockMode, accounts });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

accountsRouter.post("/", async (req, res) => {
  const { Name } = req.body ?? {};
  if (!Name || typeof Name !== "string") {
    return res.status(400).json({ error: "Name is required." });
  }
  try {
    if (config.mockMode) {
      const created = { Id: `001MOCK${Date.now()}`, ...req.body };
      mockHotels.unshift(created);
      return res.status(201).json({ mock: true, id: created.Id });
    }
    const { id } = await createAccount(req.body);
    res.status(201).json({ mock: false, id });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});
