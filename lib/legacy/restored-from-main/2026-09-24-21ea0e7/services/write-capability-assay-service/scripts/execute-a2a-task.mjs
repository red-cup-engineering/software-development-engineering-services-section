#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractSenPart, senPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { assayStandingWriteCapability } from "../src/assay-write-capability.mjs";
import { decodeWriteCapabilityRequest, encodeWriteCapabilityResponse } from "../src/protocol.mjs";
export async function executeA2aMessage(source) {
  const message = (source);
  if (message.role !== ROLE_USER) throw new Error("write-capability assay requires an A2A ROLE_USER message");
  const input = extractSenPart(message.parts), decoded = decodeWriteCapabilityRequest(input.bytes), request = decoded.value;
  let response;
  try { response = encodeWriteCapabilityResponse({ request: decoded.identity.id, disposition: "admitted", observation: assayStandingWriteCapability(request.material) }); }
  catch (error) { response = encodeWriteCapabilityResponse({ request: decoded.identity.id, disposition: "refused", reason: error instanceof Error ? error.message : String(error) }); }
  return ({ messageId: randomUUID(), contextId: message.contextId, taskId: message.taskId, role: ROLE_AGENT, parts: [senPart(response.bytes, "write-capability-response.rmn.cbor")], metadata: { responseNi: response.id }, extensions: [], referenceTaskIds: [] });
}
try { process.stdout.write(`${JSON.stringify(await executeA2aMessage(JSON.parse(readFileSync(0, "utf8"))))}\n`); }
catch (error) { process.stderr.write(`${error.stack ?? error.message}\n`); process.exitCode = 1; }
