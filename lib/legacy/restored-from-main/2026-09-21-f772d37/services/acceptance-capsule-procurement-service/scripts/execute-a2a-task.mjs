#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Message, Role } from "@a2a-js/sdk";
import { extractRmnPart, rmnPart } from "@red-cup-engineering/a2a-rmn-part-service";
import { decodeRequest, performRequest } from "../src/protocol.mjs";
import { createAcceptanceCapsuleProcurementRecordJournal } from "../src/record-journal.mjs";
import { runJavascriptNodeOperation } from "../../../../javascript-engineering-services-section/services/javascript-node-services-section/src/operation.mjs";

const DATA_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data");

export async function executeA2aMessage(source, env = process.env, options = {}) {
  const message = Message.fromJSON(source);
  if (message.role !== Role.ROLE_USER) throw new Error("acceptance procurement requires an A2A ROLE_USER message");
  const input = extractRmnPart(message.parts);
  const result = await performRequest(decodeRequest(input.bytes), options);
  const recordedAt = options.now?.() ?? new Date().toISOString();
  const dataRoot = resolve(options.dataRoot ?? env.ACCEPTANCE_CAPSULE_PROCUREMENT_DATA_ROOT ?? DATA_ROOT);
  createAcceptanceCapsuleProcurementRecordJournal({ root: dataRoot }).record({
    category: "acceptance-capsule-procurement.receipt",
    recordedAt,
    record: { ...result.receipt, semanticId: result.semanticId },
    charge: { support: true, refutation: false },
  });
  return Message.toJSON({ messageId: randomUUID(), contextId: message.contextId, taskId: message.taskId, role: Role.ROLE_AGENT, parts: [rmnPart(result.canonicalBytes, "acceptance-procurement-receipt.rmn.cbor")], metadata: { receiptNi: result.semanticId }, extensions: [], referenceTaskIds: [] });
}

if (import.meta.main) {
  const result = await runJavascriptNodeOperation({ name: "execute-a2a-task", description: "executeA2aMessage — the execute-a2a-task operation.", operation: executeA2aMessage }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}
