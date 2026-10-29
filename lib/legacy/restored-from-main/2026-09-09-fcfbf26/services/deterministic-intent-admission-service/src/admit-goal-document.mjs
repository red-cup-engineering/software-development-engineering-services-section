const ACTION = "scripts.admit-goal-document";

export function admitGoalDocument(document) {
  const rows = readEavtDocument(document);
  const additions = subjectsForAction(rows).flatMap(({ subject, facts }) => {
    const text = firstString(facts, "operations-manifold.goal.text");
    if (text === undefined) return [
      fact(subject, "operations-manifold.script.obstruction", "missing-goal-text"),
      fact(subject, "operations-manifold.result.admitted", false),
    ];
    const priority = firstNumber(facts, "operations-manifold.goal.priority") ?? 50;
    return [
      fact(subject, "operations-manifold.result.admitted", true),
      fact(subject, "operations-manifold.goal.title", firstString(facts, "operations-manifold.goal.title") ?? titleFor(text)),
      fact(subject, "operations-manifold.goal.status", "proposed"),
      fact(subject, "operations-manifold.goal.priority", clamp(priority, 0, 100)),
      fact(subject, "operations-manifold.work.candidate", true),
    ];
  });
  return writeEavtDocument([...rows, ...additions]);
}

export function readEavtDocument(text) {
  if (typeof text !== "string") throw new TypeError("goal document must be text");
  return Object.freeze(text.split(/\r?\n/u).filter((line) => line.trim() !== "").map((line, index) => {
    const row = JSON.parse(line);
    if (!Array.isArray(row) || row.length !== 4) throw new TypeError(`goal document line ${index + 1} must be an EAVT row`);
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
  return [...bySubject.values()].filter(({ facts }) => (facts.get("operations-manifold.script.action") ?? []).includes(ACTION));
}

function firstString(facts, predicate) {
  return (facts.get(predicate) ?? []).find((value) => typeof value === "string" && value.trim() !== "");
}

function firstNumber(facts, predicate) {
  return (facts.get(predicate) ?? []).find((value) => typeof value === "number" && Number.isFinite(value));
}

function fact(subject, predicate, value) {
  return Object.freeze([subject, predicate, value, Object.freeze(["deterministic-intent-admission-service", "script", ACTION])]);
}

function titleFor(text) {
  const title = text.trim().split(/\s+/u).slice(0, 12).join(" ");
  return title.length <= 96 ? title : title.slice(0, 96);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function writeEavtDocument(rows) {
  const unique = new Map(rows.map((row) => [JSON.stringify(row), row]));
  return [...unique.values()].map((row) => JSON.stringify(row)).join("\n") + (unique.size === 0 ? "" : "\n");
}
