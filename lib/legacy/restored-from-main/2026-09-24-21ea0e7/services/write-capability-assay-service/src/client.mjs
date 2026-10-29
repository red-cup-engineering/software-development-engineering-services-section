import { randomUUID } from "node:crypto";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { a2aResultParts } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { sendSenTask } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { extractSenPart, senPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { circuitInterfaceFromAgentCard, SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION } from "@red-cup-engineering/hierarchical-circuit-law";
import { decodeWriteCapabilityResponse, encodeWriteCapabilityRequest } from "./protocol.mjs";
const parts = a2aResultParts;
export async function hireStandingWriteCapabilityAssay({ agentUrl, material, signal }) {
  if (typeof agentUrl !== "string" || agentUrl.length === 0) throw new TypeError("the hired write-capability assay Agent Card URL is required");
  const request = encodeWriteCapabilityRequest(material);
  const message = ({ messageId: randomUUID(), contextId: "", taskId: "", role: ROLE_USER, parts: [senPart(request.bytes, "write-capability-request.rmn.cbor")], metadata: {}, extensions: [], referenceTaskIds: [] });
  const exchange = await sendSenTask({ agentUrl, extensions: [SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION], requireSignature: true, message, signal });
  const provider = circuitInterfaceFromAgentCard(exchange.agentCard);
  const part = extractSenPart(parts(exchange.result)), decoded = decodeWriteCapabilityResponse(part.bytes), response = decoded.value;
  if (response.request !== request.id) throw new Error("write-capability assay response does not close the exact material");
  if (response.disposition !== "admitted") throw new Error(response.reason ?? "write-capability assay refused");
  return Object.freeze({ observation: response.observation, request: request.id, response: decoded.identity.id, provider });
}
