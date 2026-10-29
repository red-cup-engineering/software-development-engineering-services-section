import assert from "node:assert/strict";
import test from "node:test";
import { admitBoundedAgenticIntent } from "../src/admit-bounded-agentic-intent.mjs";
import worker from "../src/worker.mjs";

function request(overrides = {}) {
  return {
    taskType: "analysis",
    objective: "determine the bounded answer",
    desiredUse: "produce a customer-assayable result",
    context: {sourceDigests: ["sha256:example"]},
    outputSchema: {type: "object"},
    considerationPolicy: {
      type: "ConsiderationPolicy",
      acceptableAlternatives: [{id: "internal-credit"}]
    },
    ...overrides
  };
}

test("admits market-pressure refinement without installing a hard token ceiling", () => {
  const result = admitBoundedAgenticIntent(request());
  assert.equal(Object.hasOwn(result.constraints, "maxTokens"), false);
  assert.equal(result.constraints.refinement, "market-pressure");
  assert.equal(result.constraints.upwardEscalationAuthorized, false);
  assert.equal(result.constraints.customerAcceptanceRequired, true);
  assert.throws(() => admitBoundedAgenticIntent(request({maxTokens: 4000})), /hard token ceilings/u);
});

test("refuses model/provider choice and credential-shaped context", () => {
  assert.throws(() => admitBoundedAgenticIntent(request({requestedModel: "large"})), /selection/u);
  assert.throws(() => admitBoundedAgenticIntent(request({context: {apiKey: "do-not-admit"}})), /forbidden/u);
});

test("refuses numeric values that canonical RMN cannot carry", () => {
  assert.throws(() => admitBoundedAgenticIntent(request({context: {ratio: 0.5}})), /canonical RMN/u);
});

test("serves an exact HTTP action and typed refusal", async () => {
  const accepted = await worker.fetch(new Request(
    "https://deterministic-intent-admission.actions.561.group/invoke",
    {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(request())}
  ));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).type, "BoundedInferenceWorkLotIntent");

  const refused = await worker.fetch(new Request(
    "https://deterministic-intent-admission.actions.561.group/invoke",
    {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(request({provider: "ambient"}))}
  ));
  assert.equal(refused.status, 400);
  assert.equal((await refused.json()).type, "DeterministicIntentAdmissionRefusal");
});
