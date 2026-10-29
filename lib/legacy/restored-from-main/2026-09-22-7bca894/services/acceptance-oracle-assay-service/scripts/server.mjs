#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createA2aServerProcess } from "@red-cup-engineering/a2a-services-section/a2a-server";
import { executeA2aMessage } from "./execute-a2a-task.mjs";
const port = Number(process.env.PORT ?? 19845), host = process.env.HOST ?? "127.0.0.1", baseUrl = process.env.BASE_URL ?? `http://${host}:${port}`;
const agentCard = JSON.parse(readFileSync(resolve("content/agent-cards/acceptance-oracle-assay-service.json"), "utf8"));
createA2aServerProcess({ port, host, baseUrl, agentCard, handlers: { "message/send": (message) => executeA2aMessage(message) } });
