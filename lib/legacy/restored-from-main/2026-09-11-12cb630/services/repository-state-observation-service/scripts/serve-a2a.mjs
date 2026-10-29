#!/usr/bin/env node
import { resolve } from "node:path";
import { serveContractedAgentProcess } from "@red-cup-engineering/a2a-contracted-agent-service";
const root = resolve(import.meta.dirname, "..");
serveContractedAgentProcess({ port: Number(process.env.PORT ?? "8803"), host: process.env.HOST ?? "127.0.0.1", baseUrl: process.env.BASE_URL, agentCard: resolve(root, "content/agent-cards/repository-state-observation-service.json"), executor: process.execPath, executorArgs: [resolve(root, "scripts/execute-a2a-message.mjs")] });
