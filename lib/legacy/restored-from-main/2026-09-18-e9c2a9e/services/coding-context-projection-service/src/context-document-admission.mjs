const ACTION = "scripts.admit-context-document";
const SCRIPT_ACTION = "operations-manifold.script.action";

export function admitContextDocument(document) {
  const rows = readEavtDocument(document);
  const additions = subjectsForAction(rows).flatMap(({ subject, facts }) => {
    const intent = firstString(facts, "operations-manifold.context.intent");
    if (intent === undefined) return [
      fact(subject, "operations-manifold.script.obstruction", "missing-context-intent"),
      fact(subject, "operations-manifold.result.admitted", false),
    ];
    return [
      fact(subject, "operations-manifold.result.admitted", true),
      fact(subject, "operations-manifold.context.budget", firstNumber(facts, "operations-manifold.context.budget") ?? 12_000),
      fact(subject, "operations-manifold.context.requires-suit", true),
    ];
  });
  return writeEavtDocument([...rows, ...additions]);
}

export function readEavtDocument(text) {
  if (typeof text !== "string") throw new TypeError("context document must be text");
  return Object.freeze(text.split(/\r?\n/u).filter((line) => line.trim() !== "").map((line, index) => {
    const row = JSON.parse(line);
    if (!Array.isArray(row) || row.length !== 4) throw new TypeError(`context document line ${index + 1} must be an EAVT row`);
    return Object.freeze(row);
  }));
}

function subjectsForAction(rows) {
  const bySubject = new Map();
  for (const [subject, attribute, value] of rows) {
    const key = JSON.stringify(subject);
    const entry = bySubject.get(key) ?? { subject, facts: new Map() };
    entry.facts.set(attribute, [...(entry.facts.get(attribute) ?? []), value]);
    bySubject.set(key, entry);
  }
  return [...bySubject.values()].filter(({ facts }) => (facts.get(SCRIPT_ACTION) ?? []).includes(ACTION));
}

function firstString(facts, predicate) {
  return (facts.get(predicate) ?? []).find((value) => typeof value === "string" && value.trim() !== "");
}

function firstNumber(facts, predicate) {
  return (facts.get(predicate) ?? []).find((value) => typeof value === "number" && Number.isFinite(value));
}

function fact(subject, predicate, value) {
  return Object.freeze([subject, predicate, value, Object.freeze(["coding-context-projection-service", "script", ACTION])]);
}

function writeEavtDocument(rows) {
  const unique = new Map(rows.map((row) => [JSON.stringify(row), row]));
  return [...unique.values()].map((row) => JSON.stringify(row)).join("\n") + (unique.size === 0 ? "" : "\n");
}
