#!/usr/bin/env node

import { resolve } from "node:path";
import { serveContractedAgentProcess } from "@red-cup-engineering/a2a-services-section/serve-contracted-agent";

const ROOT = resolve(import.meta.dirname, "..");
const port = process.env.PORT === undefined ? undefined : Number(process.env.PORT);
if (port !== undefined && (!Number.isSafeInteger(port) || port < 1 || port > 65535)) {
  throw new Error("PORT must be a valid colony-supplied deployment allocation");
}

serveContractedAgentProcess({
  port,
  host: process.env.HOST ?? "127.0.0.1",
  baseUrl: process.env.BASE_URL,
  agentCard: resolve(ROOT, "content/agent-cards/accepted-software-delivery-receiver.json"),
  executor: process.execPath,
  executorArgs: [resolve(ROOT, "scripts/execute-a2a-message.mjs")],
});
