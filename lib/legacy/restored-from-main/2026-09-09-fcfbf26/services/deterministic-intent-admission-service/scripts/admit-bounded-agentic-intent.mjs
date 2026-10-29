#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { admitBoundedAgenticIntent } from "../src/admit-bounded-agentic-intent.mjs";

export const admitBoundedAgenticIntentScript = (input) => admitBoundedAgenticIntent(input);

if (import.meta.main) {
  const input = JSON.parse(await readFile(0, "utf8"));
  process.stdout.write(`${JSON.stringify(admitBoundedAgenticIntentScript(input))}\n`);
}
