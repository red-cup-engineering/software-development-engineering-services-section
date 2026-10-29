import assert from "node:assert/strict";
import test from "node:test";

import { assessContextDrift } from "../src/context-drift.mjs";

const suit = Object.freeze({ intent: "move context code", mission: "engineer context services", focus: "services/context" });

test("context drift assessment is a deterministic transformation", () => {
  const assessment = assessContextDrift({ intent: "move context code", action: "moved context code and tests are passing", paths: ["services/context/src/index.mjs"], authority: "user", suit });
  assert.equal(assessment.kind, "coding-context.drift-assessment");
  assert.equal(assessment.drift, false);
  assert.equal(assessment.regime, "stabilized");
  assert.equal(assessment.metrics.length, 8);
  assert.equal("generatedAt" in assessment, false);
});

test("context drift makes scope escape and dishonest obstruction visible", () => {
  const assessment = assessContextDrift({ intent: "move context code", action: "completed with missing dependency instead", outcome: "done", paths: ["outside/file.mjs"], suit });
  assert.equal(assessment.drift, true);
  assert.equal(assessment.metrics.find((item) => item.name === "scope-fit").value, "drift");
  assert.equal(assessment.metrics.find((item) => item.name === "obstruction-honesty").value, "drift");
  assert.equal(assessment.regime, "obstructed");
});

test("context drift requires the context suit instead of reading hidden process state", () => {
  assert.throws(() => assessContextDrift({ intent: "x", action: "y" }), /assessment suit is required/);
});
