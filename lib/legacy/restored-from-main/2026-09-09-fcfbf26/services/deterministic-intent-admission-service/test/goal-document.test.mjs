import assert from "node:assert/strict";
import test from "node:test";

import { admitGoalDocument, readEavtDocument } from "../src/admit-goal-document.mjs";

const at = ["caller", "test"];

test("goal document admission deterministically adds proposed goal facts", () => {
  const source = [
    ["goal:1", "operations-manifold.script.action", "scripts.admit-goal-document", at],
    ["goal:1", "operations-manifold.goal.text", "Absorb the legacy capabilities into engineering services", at],
    ["goal:1", "operations-manifold.goal.priority", 140, at],
  ].map(JSON.stringify).join("\n");
  const rows = readEavtDocument(admitGoalDocument(source));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.result.admitted" && row[2] === true));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.goal.status" && row[2] === "proposed"));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.goal.priority" && row[2] === 100));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.work.candidate" && row[2] === true));
});

test("goal document admission reports missing goal text as an obstruction", () => {
  const source = JSON.stringify(["goal:2", "operations-manifold.script.action", "scripts.admit-goal-document", at]);
  const rows = readEavtDocument(admitGoalDocument(source));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.script.obstruction" && row[2] === "missing-goal-text"));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.result.admitted" && row[2] === false));
});

test("goal document admission is idempotent", () => {
  const source = [
    ["goal:3", "operations-manifold.script.action", "scripts.admit-goal-document", at],
    ["goal:3", "operations-manifold.goal.text", "Continue", at],
  ].map(JSON.stringify).join("\n");
  const once = admitGoalDocument(source);
  assert.equal(admitGoalDocument(once), once);
});
