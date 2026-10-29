#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractRmnPart, rmnPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { decodeRequest, performAssay } from "../src/protocol.mjs";
import { createAcceptanceOracleAssayRecordJournal } from "../src/record-journal.mjs";
import { runJavascriptNodeOperation } from "@red-cup-engineering/javascript-node-services-section/operation";

const DATA_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data");

export async function executeA2aMessage(source, env = process.env, options = {}) {
  const message = (source);
  if (message.role !== ROLE_USER) throw new Error("oracle assay requires A2A ROLE_USER");
  const input = extractRmnPart(message.parts);
  const result = await performAssay(decodeRequest(input.bytes));
  const recordedAt = options.now?.() ?? new Date().toISOString();
  const dataRoot = resolve(options.dataRoot ?? env.ACCEPTANCE_ORACLE_ASSAY_DATA_ROOT ?? DATA_ROOT);
  createAcceptanceOracleAssayRecordJournal({ root: dataRoot }).record({
    category: "acceptance-oracle-assay.receipt",
    recordedAt,
    record: { ...result.receipt, semanticId: result.semanticId },
    charge: { support: true, refutation: false },
  });
  return ({ messageId: randomUUID(), contextId: message.contextId, taskId: message.taskId, role: ROLE_AGENT, parts: [rmnPart(result.canonicalBytes, "acceptance-oracle-assay-receipt.rmn.cbor")], metadata: { disposition: result.receipt.assay.accepted ? "oracle-evidence-assayed" : "oracle-evidence-not-assayed", receiptNi: result.semanticId }, extensions: [], referenceTaskIds: [] });
}

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({ name: "execute-a2a-task", description: "executeA2aMessage — the execute-a2a-task operation.", operation: executeA2aMessage }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}
