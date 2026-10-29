import assert from "node:assert/strict";
import test from "node:test";
import { projectContextCognition } from "../src/context-cognition.mjs";
test("projects finite cognition from explicit carriers", () => {
  const bundle = { generatedAt: "2026-08-30T00:00:00.000Z", readiness: { criteria: [{ id: "context", title: "Context", status: "missing", score: 0, missing: ["admit-context"], next: "move it" }], nextWork: ["move it"], summary: { score: 20 } }, context: { admissions: [], assessments: [], eventCount: 0 }, suit: { perception: [], memory: [] }, goals: { goals: [], eventCount: 0 }, work: { items: [], active: [], eventCount: 0 }, operations: { totals: { entries: 0 }, byPredicate: [], eventCount: 0 } };
  assert.equal(projectContextCognition("wonder-context", bundle).result.gapCount, 1);
  assert.deepEqual(projectContextCognition("derive-context", bundle).result.plan, [{ step: 1, work: "move it" }]);
  assert.equal(projectContextCognition("inquire-context", { ...bundle, search: { packages: [], functions: [], types: [] }, coverage: { gaps: ["missing"], coveredTerms: [] } }).evidence[0].text, "missing");
  assert.equal(projectContextCognition("explore-context", { ...bundle, workspaceGraph: { graph: { nodes: [{ id: "package:nog" }], edges: [] } } }).result.graph.graph.nodes.length, 1);
});
