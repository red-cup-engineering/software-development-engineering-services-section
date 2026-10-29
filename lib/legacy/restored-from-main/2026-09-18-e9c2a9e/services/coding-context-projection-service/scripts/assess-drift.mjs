#!/usr/bin/env node
import { assessContextDrift } from "../src/context-drift.mjs";

export const assessDriftScript = (params = {}) => assessContextDrift(params);

async function readParams() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (text === "") return {};
  const value = JSON.parse(text);
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("stdin JSON must be an object");
  return value;
}

if (import.meta.main) {
  try {
    process.stdout.write(`${JSON.stringify(assessDriftScript(await readParams()))}\n`);
  } catch (error) {
    process.stderr.write(`assess-drift: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
