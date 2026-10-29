#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { admitContextRequest } from "../src/context-events.mjs";
export { admitContextRequest };
if (import.meta.main) { const input = JSON.parse(readFileSync(0, "utf8")); process.stdout.write(`${JSON.stringify(admitContextRequest(input, { at: input.at }))}\n`); }
