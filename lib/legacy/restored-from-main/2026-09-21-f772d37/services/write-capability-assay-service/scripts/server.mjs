#!/usr/bin/env node
import { resolve } from "node:path";
import { serveContractedAgentProcess } from "@red-cup-engineering/a2a-contracted-agent-service";
const port = Number(process.env.PORT ?? 19833), host = process.env.HOST ?? "127.0.0.1", baseUrl = process.env.BASE_URL ?? `http://${host}:${port}`;
serveContractedAgentProcess({ port, host, baseUrl, agentCard: resolve("content/agent-cards/standing-write-capability-assay-service.json"), executor: process.execPath, executorArgs: [resolve("scripts/execute-a2a-task.mjs")] });
