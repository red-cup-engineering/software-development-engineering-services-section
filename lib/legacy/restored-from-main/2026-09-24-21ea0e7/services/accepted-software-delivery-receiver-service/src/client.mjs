import { randomUUID } from "node:crypto";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { a2aResultParts } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { resumeSenTask, sendSenTask } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { extractSenPart, senPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { ACTOR, OPERATIONS, operationBytes, operationFromBytes, record } from "./a2a-executor.mjs";

function agentUrl(value) {
  const url = value ?? process.env.ACCEPTED_SOFTWARE_DELIVERY_RECEIVER_AGENT_CARD_URL;
  if (typeof url !== "string" || !url) throw new Error("ACCEPTED_SOFTWARE_DELIVERY_RECEIVER_AGENT_CARD_URL is required");
  return url;
}

async function contact(request, {
  agentCardUrl,
  send = sendSenTask,
  resume = resumeSenTask,
  resumeTaskId,
  onTaskObservation,
  signal,
} = {}) {
  const message = ({
    messageId: randomUUID(),
    contextId: "",
    taskId: "",
    role: ROLE_USER,
    parts: [senPart(operationBytes(request))],
    metadata: {},
    extensions: [],
    referenceTaskIds: [],
  });
  const address = agentUrl(agentCardUrl);
  const transport = resumeTaskId
    ? await resume({ agentUrl: address, taskId: resumeTaskId, inputNi: request.id, requireSignature: true, onTaskObservation, signal })
    : await send({ agentUrl: address, message, requireSignature: true, onTaskObservation, signal });
  const output = extractSenPart(a2aResultParts(transport.result));
  const response = operationFromBytes(output.bytes);
  if (response?.provider !== ACTOR || response.request !== request.id) {
    throw new Error("accepted-delivery receiver returned a foreign operation result");
  }
  return Object.freeze({
    response,
    transport: {
      inputNi: transport.inputNi,
      outputNi: transport.outputNi,
      agentCard: transport.agentCard,
      authentication: { agentCardSignatureVerified: true, required: true },
    },
  });
}

export async function solicitAcceptedSoftwareDeliveryReceiver(operation, requestCore, {
  customer,
  recordedAt = new Date().toISOString(),
  ...transportOptions
} = {}) {
  if (!OPERATIONS.includes(operation) || typeof customer !== "string" || !customer.startsWith("urn:")) {
    throw new Error("exact receiver operation and customer are required");
  }
  const request = record({
    type: "AcceptedSoftwareDeliveryReceiverSolicitation",
    provider: ACTOR,
    customer,
    operation,
    requestCore,
    recordedAt,
  });
  const contacted = await contact(request, transportOptions);
  if (contacted.response.type !== "AcceptedSoftwareDeliveryReceiverSolicitationResult") return contacted;
  return Object.freeze({ ...contacted, offer: contacted.response.offer });
}

export async function invokeAcceptedSoftwareDeliveryReceiver(operation, receiverRequest, {
  customer,
  ...transportOptions
} = {}) {
  if (!OPERATIONS.includes(operation) || typeof customer !== "string" || !customer.startsWith("urn:")) {
    throw new Error("exact receiver operation and customer are required");
  }
  const request = record({
    type: "AcceptedSoftwareDeliveryReceiverInvocation",
    provider: ACTOR,
    customer,
    operation,
    receiverRequest,
  });
  const contacted = await contact(request, transportOptions);
  if (contacted.response.type !== "AcceptedSoftwareDeliveryReceiverInvocationResult") return contacted;
  return Object.freeze({ ...contacted, result: contacted.response.result });
}
