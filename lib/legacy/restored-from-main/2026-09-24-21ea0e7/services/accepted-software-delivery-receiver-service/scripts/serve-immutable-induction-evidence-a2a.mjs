#!/usr/bin/env node
import { resolve } from "node:path";
import { serveContractedAgentProcess } from "@red-cup-engineering/a2a-services-section/serve-contracted-agent";
import { readImmutableEvidenceRoutes } from "../src/immutable-induction-evidence.mjs";
const root = resolve(import.meta.dirname, "..");
const port = process.env.PORT === undefined ? undefined : Number(process.env.PORT);
if (port !== undefined && (!Number.isSafeInteger(port) || port < 1 || port > 65535)) {
  throw new Error("PORT must be a deployment allocation");
}
const routesFile = process.env.IMMUTABLE_EVIDENCE_ROUTES;
if (typeof routesFile !== "string" || routesFile.length === 0) {
  throw new Error("IMMUTABLE_EVIDENCE_ROUTES is required");
}
readImmutableEvidenceRoutes(routesFile);
serveContractedAgentProcess({ port, host: process.env.HOST ?? "127.0.0.1", baseUrl: process.env.BASE_URL,
  agentCard: resolve(root, "content/agent-cards/immutable-induction-evidence-read-node.json"),
  executor: process.execPath,
  executorArgs: [resolve(root, "scripts/execute-immutable-induction-evidence-a2a-message.mjs")],
});
