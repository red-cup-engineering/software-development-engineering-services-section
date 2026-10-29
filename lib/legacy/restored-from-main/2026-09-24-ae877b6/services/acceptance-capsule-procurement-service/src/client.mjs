import { randomUUID } from "node:crypto";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { a2aResultParts } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { sendSenTask } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { extractSenPart, senPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { decodeReceipt, encodeRequest, receiptIdentity } from "./protocol.mjs";
import { SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION, providerAccountFromAgentCard } from "./sovereign-provider.mjs";
const parts = a2aResultParts;
export async function procureSoftwareAcceptanceCapsule(input, { agentCardUrl = process.env.ACCEPTANCE_CAPSULE_PROCUREMENT_AGENT_CARD_URL, signal, send = sendSenTask } = {}) {
  if (!agentCardUrl) throw new Error("ACCEPTANCE_CAPSULE_PROCUREMENT_AGENT_CARD_URL is required");
  const request = encodeRequest({ kind: "AcceptanceCapsuleProcurementRequest", input });
  const message = ({ messageId: randomUUID(), contextId: "", taskId: "", role: ROLE_USER, parts: [senPart(request.bytes, "acceptance-procurement-request.rmn.cbor")], metadata: {}, extensions: [], referenceTaskIds: [] });
  const exchange = await send({ agentUrl: agentCardUrl, extensions: [SOVEREIGN_CIRCUIT_INTERFACE_EXTENSION], requireSignature: true, message, ...(signal ? { signal } : {}) });
  const output = extractSenPart(parts(exchange.result));
  const receipt = decodeReceipt(output.bytes), provider = providerAccountFromAgentCard(exchange.agentCard); if (receipt.provider !== provider || receipt.subject !== request.id) throw new Error("acceptance procurement receipt does not bind the contracted face and exact subject");
  return Object.freeze({ ...receipt.settlement, procurementProvider: provider, procurementReceiptNi: receiptIdentity(receipt) });
}
