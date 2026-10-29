import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractRmnPart, rmnPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { decodeSemantic, semanticBytes, semanticId } from "@red-cup-engineering/relation-model-notation/cbor-codec";
import { observeCapabilityCellFabricationRun } from "./observe.mjs";

export const ACTOR = "urn:ame:capability-cell-fabrication-run-monitor-service";

export async function executeA2aMessage(source, options = {}) {
  const message = (source);
  if (message.role !== ROLE_USER) {
    throw new Error("fabrication-run Monitor requires an A2A user Message");
  }
  const input = extractRmnPart(message.parts);
  const request = decodeSemantic(input.bytes);
  const result = (options.observe ?? observeCapabilityCellFabricationRun)(request);
  const outputBytes = semanticBytes(result);
  return ({
    messageId: "",
    contextId: message.contextId ?? "",
    taskId: message.taskId ?? "",
    role: ROLE_AGENT,
    parts: [rmnPart(outputBytes, "fabrication-run-observation.rmn.cbor")],
    metadata: {
      provider: ACTOR,
      inputNi: input.ni,
      outputNi: semanticId(result),
    },
    extensions: [],
    referenceTaskIds: [],
  });
}
