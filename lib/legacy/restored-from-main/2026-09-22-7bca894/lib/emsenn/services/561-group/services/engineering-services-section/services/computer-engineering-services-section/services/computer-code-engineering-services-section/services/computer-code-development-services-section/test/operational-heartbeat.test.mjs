import test from "node:test"; import assert from "node:assert/strict";
import { projectOperationalHeartbeat } from "../scripts/project-operational-heartbeat.mjs";
test("projects pressure and next work from supplied carriers", () => {
  const result = projectOperationalHeartbeat({ goals: { goals: [{ id: "g", status: "active" }] }, work: { work: [{ id: "w", title: "Repair", status: "blocked" }] }, operations: { entries: [] }, orchestration: {} }, {}, { generatedAt: "2026-08-30T00:00:00.000Z" });
  assert.equal(result.pressures[0].id, "blocked-work"); assert.equal(result.nextWork[0].id, "w");
});
