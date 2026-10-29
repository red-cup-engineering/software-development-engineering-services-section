import assert from "node:assert/strict";
import test from "node:test";
import { ROLE_AGENT, ROLE_USER } from "@red-cup-engineering/a2a-services-section/a2a-client";
import {
  extractRmnPart,
  userRmnMessage,
} from "@red-cup-engineering/a2a-services-section/rmn-part";
import { decodeSemantic, semanticBytes } from "@red-cup-engineering/relation-model-notation/cbor-codec";
import { executeA2aMessage } from "../src/a2a-executor.mjs";
import { canonicalEventIdentity } from "../src/event-identity.mjs";

test("the A2A face invokes the same Monitor executable through exact RMN bytes", async () => {
  const run = "11111111-1111-4111-8111-111111111111";
  const body = {
    run,
    sequence: 0,
    at: "2026-07-25T00:00:00.000Z",
    previous: null,
    type: "demand-submitted",
    demand: { capability: "toast-bread" },
  };
  const request = {
    type: "CapabilityCellFabricationRunObservationRequest",
    run,
    stages: ["extract", "plan", "execute"],
    events: [{
      id: canonicalEventIdentity(body),
      ...body,
    }],
  };
  const response = (await executeA2aMessage(
    userRmnMessage(semanticBytes(request)),
  ));
  assert.equal(response.role, ROLE_AGENT);
  const result = decodeSemantic(extractRmnPart(response.parts).bytes);
  assert.equal(result.type, "CapabilityCellFabricationRunObservation");
  assert.equal(result.state.id, run);
  assert.equal(result.state.currentStage, "extract");
  assert.equal(result.state.eventCount, 1);
});
