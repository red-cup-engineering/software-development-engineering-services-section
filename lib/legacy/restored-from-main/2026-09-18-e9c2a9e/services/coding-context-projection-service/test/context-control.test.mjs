import assert from "node:assert/strict";
import test from "node:test";
import { foldContextEvents } from "../src/context-control.mjs";
import { admitContextRequest } from "../src/context-events.mjs";
import { projectContextSuit } from "../src/context-suit.mjs";
test("admits, folds, and suits explicit context carriers", () => {
  const admission = admitContextRequest({ intent: "consume capabilities", focus: "services/js" }, { at: "2026-08-30T00:00:00.000Z" });
  const goals = { goals: [{ id: "goal:one", text: "consume", status: "active", focus: "services/js", evidence: ["goal-event:one"] }] };
  const work = { items: [{ id: "work:one", title: "Move script", status: "active", workStatus: "in-progress", gate: "stop", focus: "services/js", agent: "codex", session: null, evidence: ["work-event:one"] }] };
  const snapshot = foldContextEvents([admission.event], { goals, work, generatedAt: "2026-08-30T00:01:00.000Z" });
  assert.equal(snapshot.admissions.length, 1); assert.equal(snapshot.latestSuit.workload.length, 1);
  const suit = projectContextSuit({ admission: snapshot.admissions[0], goals, work, generatedAt: "2026-08-30T00:01:00.000Z" });
  assert.equal(suit.focus, "services/js"); assert.equal(suit.provenance.length, 3);
});
