#!/usr/bin/env node
import { admitGoalDocument } from "../src/admit-goal-document.mjs";

export const admitGoalDocumentScript = (document) => admitGoalDocument(document);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

if (import.meta.main) {
  try {
    process.stdout.write(admitGoalDocumentScript(await readStdin()));
  } catch (error) {
    process.stderr.write(`admit-goal-document: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
