#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { projectContextSuit } from "../src/context-suit.mjs";
export { projectContextSuit };
if (import.meta.main) process.stdout.write(`${JSON.stringify(projectContextSuit(JSON.parse(readFileSync(0, "utf8"))))}\n`);
