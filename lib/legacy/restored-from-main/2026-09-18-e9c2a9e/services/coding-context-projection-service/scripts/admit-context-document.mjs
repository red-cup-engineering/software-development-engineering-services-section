#!/usr/bin/env node
import { admitContextDocument } from "../src/context-document-admission.mjs";

export const admitContextDocumentScript = (document) => admitContextDocument(document);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

if (import.meta.main) {
  try {
    process.stdout.write(admitContextDocumentScript(await readStdin()));
  } catch (error) {
    process.stderr.write(`admit-context-document: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
