import { Message, Role } from "@a2a-js/sdk";
import { extractRmnPart, rmnPart } from "@red-cup-engineering/a2a-rmn-part-service";
import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/relation-model-notation/runtime";
import { createSoftwareProgramSynthesisSolicitation } from "@red-cup-engineering/software-program-synthesis-solicitation-service";
import { runProgram } from "./program-runtime.mjs";
import { ACTOR, SYNTHESIS_EFFECTS, exactOperation, operationBytes, operationFromBytes, record } from "./protocol.mjs";
export { ACTOR, SYNTHESIS_EFFECTS, exactOperation, operationBytes, operationFromBytes, record } from "./protocol.mjs";

const solicitationMaterial = createSoftwareProgramSynthesisSolicitation({ actor: ACTOR, effects: SYNTHESIS_EFFECTS, exactOperation, record });

function containsForbiddenSettlementClaim(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsForbiddenSettlementClaim);
  if (value.integrated === true || value.customerMutation === true || value.admitted === true || value.accepted === true
    || Object.hasOwn(value, "receiver") || Object.hasOwn(value, "receiverCustody") || Object.hasOwn(value, "writeReceiver")) return true;
  return Object.values(value).some(containsForbiddenSettlementClaim);
}

function deliveryFor(contract, value) {
  try { identifyJsonSemanticContent({ objectKind: "software-program-synthesis.delivery.v2", value, witnessRoot: EMPTY_WITNESS_ROOT }); } catch {
    throw new Error("synthesis may return only one strict JSON program delivery");
  }
  if (!value || Object.getPrototypeOf(value) !== Object.prototype
    || value.id !== contract.request.program.id
    || value.status !== "awaiting-receiver-induction"
    || value.acceptance?.passed !== false
    || containsForbiddenSettlementClaim(value)) {
    throw new Error("synthesis may return only the exact unaccepted, unadmitted program delivery awaiting its receiver");
  }
  return value;
}

export async function executeContractedSoftwareProgramSynthesis(contract, options = {}) {
  const { offer, request } = solicitationMaterial.validateContractedSoftwareProgramSynthesis(contract);
  const result = deliveryFor(contract, await (options.runProgram ?? runProgram)(request.program, options.execution));
  return record({
    type: "SoftwareProgramSynthesisContractResult",
    provider: ACTOR,
    customer: contract.customer,
    contract: contract.id,
    offer: offer.id,
    request: request.id,
    program: request.program.id,
    result,
  });
}

export async function executeOperation(operation, options = {}) {
  if (operation?.type === "SoftwareProgramSynthesisSolicitation") return solicitationMaterial.solicitSoftwareProgramSynthesis(operation);
  if (operation?.type === "SoftwareProgramSynthesisContract") return executeContractedSoftwareProgramSynthesis(operation, options);
  throw new Error("only synthesis solicitation or contracted synthesis invocation is admitted");
}

export async function executeA2aMessage(source, options = {}) {
  const message = Message.fromJSON(source);
  if (message.role !== Role.ROLE_USER) throw new Error("software program executor requires an A2A user Message");
  const input = extractRmnPart(message.parts);
  const response = await executeOperation(operationFromBytes(input.bytes), options);
  return Message.toJSON({
    messageId: "", contextId: message.contextId ?? "", taskId: message.taskId ?? "", role: Role.ROLE_AGENT,
    parts: [rmnPart(operationBytes(response))],
    metadata: { inputNi: input.ni, outputNi: response.id, provider: ACTOR },
    extensions: [], referenceTaskIds: [],
  });
}
