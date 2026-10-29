import { projectContextSuit } from "./context-suit.mjs";

/** Fold supplied context events and related state into the control projection. */
export function foldContextEvents(events, input = {}) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array"); const admissions = []; const assessments = [];
  for (const row of events) {
    if (!Array.isArray(row) || row.length !== 4 || row[2] === null || typeof row[2] !== "object") continue; const [id, attribute, value] = row;
    if (typeof id !== "string" || typeof value.eventId !== "string" || typeof value.at !== "string") continue;
    if (attribute === "coding-context.admitted" && value.kind === "coding-context.event" && value.event === "admitted" && typeof value.intent === "string") admissions.push(Object.freeze({ kind: "coding-context.admission-record", id, eventId: value.eventId, at: value.at, intent: value.intent, focus: value.focus ?? null, authority: value.authority ?? "user", budget: value.budget ?? 1600, candidates: Object.freeze([...(value.candidates ?? [])]), evidence: Object.freeze([`context-event:${value.eventId}`]) }));
    if (attribute === "coding-context.drift-assessed" && value.kind === "coding-context.event") assessments.push(Object.freeze({ ...value, id }));
  }
  admissions.sort((a, b) => b.at.localeCompare(a.at)); assessments.sort((a, b) => b.at.localeCompare(a.at)); const generatedAt = String(input.generatedAt ?? new Date().toISOString());
  return Object.freeze({ kind: "coding-context.control-snapshot", generatedAt, eventCount: events.length, admissions: Object.freeze(admissions), latestSuit: admissions[0] === undefined ? null : projectContextSuit({ admission: admissions[0], goals: input.goals, work: input.work, generatedAt }), assessments: Object.freeze(assessments) });
}

export function selectContextAdmission(snapshot, params = {}) { const requested = params.admission === undefined ? null : String(params.admission).trim(); if (requested) return snapshot.admissions.find(({ id }) => id === requested) ?? null; const focus = params.focus === undefined ? null : String(params.focus).trim(); return focus ? snapshot.admissions.find((item) => item.focus === focus) ?? snapshot.admissions[0] ?? null : snapshot.admissions[0] ?? null; }
