#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { foldContextEvents } from "../src/context-control.mjs";
export { foldContextEvents };
if (import.meta.main) { const input = JSON.parse(readFileSync(0, "utf8")); process.stdout.write(`${JSON.stringify(foldContextEvents(input.events, input))}\n`); }
