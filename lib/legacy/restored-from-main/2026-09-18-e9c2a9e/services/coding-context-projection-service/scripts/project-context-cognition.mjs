#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { projectContextCognition } from "../src/context-cognition.mjs";
export { projectContextCognition };
if (import.meta.main) { const input = JSON.parse(readFileSync(0, "utf8")); process.stdout.write(`${JSON.stringify(projectContextCognition(input.verb, input.bundle, input.params))}\n`); }
