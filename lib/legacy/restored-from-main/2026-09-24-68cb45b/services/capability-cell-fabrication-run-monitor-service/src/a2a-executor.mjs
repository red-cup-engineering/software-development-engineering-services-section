import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import { extractSenPart, senPart } from "@red-cup-engineering/a2a-services-section/rmn-part";
import { decodeSemantic, semanticBytes, semanticId } from "@red-cup-engineering/computer-content-engineering-services-section/semiotic-content-address";
import { observeCapabilityCellFabricationRun } from "./observe.mjs";

export const ACTOR = "urn:ame:capability-cell-fabrication-run-monitor-service";

export async function executeA2aMessage(source, options = {}) {
  const message = (source);
  if (message.role !== ROLE_USER) {
    throw new Error("fabrication-run Monitor requires an A2A user Message");
  }
  const input = extractSenPart(message.parts);
  const request = decodeSemantic(input.bytes);
  const result = (options.observe ?? observeCapabilityCellFabricationRun)(request);
  const outputBytes = semanticBytes(result);
  return ({
    messageId: "",
    contextId: message.contextId ?? "",
    taskId: message.taskId ?? "",
    role: ROLE_AGENT,
    parts: [senPart(outputBytes, "fabrication-run-observation.rmn.cbor")],
    metadata: {
      provider: ACTOR,
      inputNi: input.ni,
      outputNi: semanticId(result),
    },
    extensions: [],
    referenceTaskIds: [],
  });
}
