import { createHash } from "node:crypto";

function optionalText(value) { if (value === undefined || value === null) return null; const text = String(value).trim(); return text === "" ? null : text; }
function requiredText(value, name) { const text = optionalText(value); if (text === null) throw new TypeError(`${name} must be a nonempty string`); return text; }
function hash(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 56) || "context"; }
function bounded(value, fallback = 1600) { const number = Number(value); return Number.isFinite(number) ? Math.max(400, Math.min(16_000, Math.round(number))) : fallback; }
function strings(value) { return Object.freeze((typeof value === "string" ? value.split(/\r?\n|,/u) : Array.isArray(value) ? value : []).map(optionalText).filter((item) => item !== null)); }
function candidate(uri, tier = "sense", weight = 90) { return Object.freeze({ uri, tier, weight: Math.max(0, Math.min(100, Math.round(weight))) }); }

export function defaultContextCandidates(focus = null) {
  return Object.freeze([
    candidate("AGENTS.md", "sense", 100),
    candidate("sites/ops.561.group/data/state/goals.json", "sense", 96),
    candidate("sites/ops.561.group/dev/docs/agentic-drift-control.md", "remembered-sense", 88),
    ...(focus === null ? [] : [candidate(focus, "sense", 92)]),
  ]);
}

function parseCandidate(value) {
  const [uri, proposedTier, proposedWeight] = value.split("|").map((item) => item.trim());
  const tier = ["sense", "remembered-sense", "learning"].includes(proposedTier) ? proposedTier : "sense";
  return candidate(requiredText(uri, "candidate uri"), tier, proposedWeight === undefined ? tier === "sense" ? 90 : tier === "remembered-sense" ? 70 : 45 : bounded(proposedWeight, 90));
}

/** Admit one context request without reading or mutating any journal. */
export function admitContextRequest(params, options = {}) {
  const at = requiredText(options.at ?? params.at, "at"); const intent = requiredText(params.intent ?? params.q, "context intent");
  const focus = optionalText(params.focus); const authority = optionalText(params.authority) ?? "user"; const budget = bounded(params.budget);
  const supplied = strings(params.candidateSources ?? params.sources); const candidates = Object.freeze([...(supplied.length === 0 ? defaultContextCandidates(focus) : supplied.map(parseCandidate))].sort((a, b) => b.weight - a.weight || a.uri.localeCompare(b.uri)));
  const source = optionalText(params.source) ?? "coding-context-projection-service"; const eventId = `context-event:${hash({ at, intent, focus, authority, budget, candidates, source }).slice(0, 24)}`; const id = `context:${slug(intent)}:${hash({ at, intent, focus }).slice(0, 12)}`;
  const value = Object.freeze({ kind: "coding-context.event", event: "admitted", eventId, at, intent, ...(focus === null ? {} : { focus }), authority, budget, candidates, source });
  return Object.freeze({ kind: "coding-context.admission", accepted: true, id, value, event: Object.freeze([id, "coding-context.admitted", value, Object.freeze({ at, eventId })]) });
}
