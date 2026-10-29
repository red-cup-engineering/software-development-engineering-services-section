import { randomUUID } from "node:crypto";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { a2aResultParts } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractSenPart, senPart, sendSenTask } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { checkTerm } from "@red-cup-engineering/computer-code-engineering-services-section/semiotic-expression-notation/runtime";
import { decodeSemantic, semanticBytes } from "@red-cup-engineering/computer-content-engineering-services-section/semiotic-content-address";
import { circuitInterfaceFromAgentCard, SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION } from "@red-cup-engineering/hierarchical-circuit-law";
import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/computer-code-engineering-services-section/semiotic-expression-notation/runtime";
import { decodeSynthesisReceipt, encodeSynthesisRequest } from "./synthesis.mjs";
const parts = a2aResultParts;
export async function requestRecursiveObservationCircuitSynthesis({ agentUrl, root, plate, cover, tally, observers, signal, send = sendSenTask }) {
  const request = encodeSynthesisRequest({ kind: "RecursiveObservationCircuitSynthesisRequest", root, plate, cover, tally, observers });
  const term = ["ascribe", request.type, request.term], message = ({ messageId: randomUUID(), contextId: "", taskId: "", role: ROLE_USER, parts: [senPart(semanticBytes(term), "recursive-observation-synthesis-request.rmn.cbor")], metadata: {}, extensions: [], referenceTaskIds: [] });
  const exchange = await send({ agentUrl, extensions: [SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION], message, requireSignature: true, ...(signal ? { signal } : {}) });
  const output = extractSenPart(parts(exchange.result)), response = decodeSemantic(output.bytes);
  if (!semanticBytes(response).equals(output.bytes) || response?.[0] !== "ascribe" || response.length !== 3) throw new Error("synthesis provider returned noncanonical RMN");
  checkTerm(response[2], response[1]); const receipt = decodeSynthesisReceipt(response[1], response[2]), provider = circuitInterfaceFromAgentCard(exchange.agentCard);
  if (receipt.provider !== provider.account) throw new Error("synthesis receipt provider does not own the signed Agent Card");
  const identity = identifyJsonSemanticContent({ objectKind: "recursive-observation-circuit.synthesis-receipt", value: receipt, witnessRoot: EMPTY_WITNESS_ROOT });
  return { receipt, receiptNi: identity.token, response, exchange };
}
