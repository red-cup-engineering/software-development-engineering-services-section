#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractSenPart, senPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { decodeRequest, performRequest } from "../src/protocol.mjs";
import { createAcceptanceCapsuleProcurementRecordJournal } from "../src/record-journal.mjs";
import { runJavascriptNodeOperation } from "../../../../javascript-engineering-services-section/services/javascript-node-services-section/src/operation.mjs";

const DATA_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data");

export async function executeA2aMessage(source, env = process.env, options = {}) {
  const message = (source);
  if (message.role !== ROLE_USER) throw new Error("acceptance procurement requires an A2A ROLE_USER message");
  const input = extractSenPart(message.parts);
  const result = await performRequest(decodeRequest(input.bytes), options);
  const recordedAt = options.now?.() ?? new Date().toISOString();
  const dataRoot = resolve(options.dataRoot ?? env.ACCEPTANCE_CAPSULE_PROCUREMENT_DATA_ROOT ?? DATA_ROOT);
  createAcceptanceCapsuleProcurementRecordJournal({ root: dataRoot }).record({
    category: "acceptance-capsule-procurement.receipt",
    recordedAt,
    record: { ...result.receipt, semanticId: result.semanticId },
    charge: { support: true, refutation: false },
  });
  return ({ messageId: randomUUID(), contextId: message.contextId, taskId: message.taskId, role: ROLE_AGENT, parts: [senPart(result.canonicalBytes, "acceptance-procurement-receipt.rmn.cbor")], metadata: { receiptNi: result.semanticId }, extensions: [], referenceTaskIds: [] });
}

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({ name: "execute-a2a-task", description: "executeA2aMessage — the execute-a2a-task operation.", operation: executeA2aMessage }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}
