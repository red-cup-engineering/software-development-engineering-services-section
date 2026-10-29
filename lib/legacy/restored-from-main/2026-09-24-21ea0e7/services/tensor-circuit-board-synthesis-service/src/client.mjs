import { randomUUID } from "node:crypto";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { a2aResultParts } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractSenPart, senPart, sendSenTask } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { checkTerm } from "@red-cup-engineering/computer-code-engineering-services-section/semiotic-expression-notation/runtime";
import { decodeSemantic, semanticBytes, semanticId } from "@red-cup-engineering/computer-content-engineering-services-section/semiotic-content-address";
import { SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION, circuitInterfaceFromAgentCard } from "@red-cup-engineering/hierarchical-circuit-law";
import { decodeSynthesisReceipt, encodeSynthesisRequest } from "./synthesis.mjs";

const parts = a2aResultParts;

export async function requestTensorCircuitBoardSynthesis({ agentUrl, root, faces, signal, send = sendSenTask }) {
  const request = encodeSynthesisRequest({ kind: "TensorCircuitBoardSynthesisRequest", root, faces });
  const term = ["ascribe", request.type, request.term];
  const message = ({
    messageId: randomUUID(), contextId: "", taskId: "", role: ROLE_USER,
    parts: [senPart(semanticBytes(term), "tensor-circuit-board-synthesis-request.rmn.cbor")],
    metadata: {}, extensions: [], referenceTaskIds: [],
  });
  const exchange = await send({ agentUrl, extensions: [SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION], message, requireSignature: true, ...(signal ? { signal } : {}) });
  const output = extractSenPart(parts(exchange.result));
  const response = decodeSemantic(output.bytes);
  if (!semanticBytes(response).equals(output.bytes) || response?.[0] !== "ascribe" || response.length !== 3) throw new Error("synthesis provider returned noncanonical RMN");
  checkTerm(response[2], response[1]);
  const receipt = decodeSynthesisReceipt(response[1], response[2]);
  const provider = circuitInterfaceFromAgentCard(exchange.agentCard);
  if (receipt.provider !== provider.account) throw new Error("synthesis receipt provider does not own the signed Agent Card");
  return { receipt, receiptNi: semanticId(response), response, exchange };
}
