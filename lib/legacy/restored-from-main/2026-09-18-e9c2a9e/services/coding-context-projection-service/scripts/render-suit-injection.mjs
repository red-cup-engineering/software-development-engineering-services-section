#!/usr/bin/env node
import { renderSuitInjection } from "../src/suit-injection.mjs";
import { runJavascriptNodeOperation } from "@red-cup-engineering/javascript-node-services-section/operation";
export async function main() { const chunks=[]; for await (const chunk of process.stdin) chunks.push(chunk); const input=JSON.parse(Buffer.concat(chunks).toString("utf8")||"{}"); process.stdout.write(renderSuitInjection(input.carriers??input,input.params??{})); }

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({ name: "render-suit-injection", description: "main — the render-suit-injection operation.", operation: main }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}
