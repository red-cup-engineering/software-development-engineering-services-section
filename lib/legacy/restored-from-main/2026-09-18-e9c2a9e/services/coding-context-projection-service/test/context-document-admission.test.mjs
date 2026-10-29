import assert from "node:assert/strict";
import test from "node:test";

import { admitContextDocument, readEavtDocument } from "../src/context-document-admission.mjs";

const time = ["caller", "test"];

test("context document admission adds the context consequences as EAVT", () => {
  const source = [
    ["turn:1", "operations-manifold.script.action", "scripts.admit-context-document", time],
    ["turn:1", "operations-manifold.context.intent", "inspect the package", time],
    ["turn:1", "operations-manifold.context.budget", 5000, time],
  ].map(JSON.stringify).join("\n");
  const rows = readEavtDocument(admitContextDocument(source));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.result.admitted" && row[2] === true));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.context.budget" && row[2] === 5000));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.context.requires-suit" && row[2] === true));
});

test("context document admission makes a missing intent an obstruction", () => {
  const source = JSON.stringify(["turn:2", "operations-manifold.script.action", "scripts.admit-context-document", time]);
  const rows = readEavtDocument(admitContextDocument(source));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.script.obstruction" && row[2] === "missing-context-intent"));
  assert.ok(rows.some((row) => row[1] === "operations-manifold.result.admitted" && row[2] === false));
});

test("context document admission is idempotent", () => {
  const source = [
    ["turn:3", "operations-manifold.script.action", "scripts.admit-context-document", time],
    ["turn:3", "operations-manifold.context.intent", "continue", time],
  ].map(JSON.stringify).join("\n");
  const once = admitContextDocument(source);
  assert.equal(admitContextDocument(once), once);
});
