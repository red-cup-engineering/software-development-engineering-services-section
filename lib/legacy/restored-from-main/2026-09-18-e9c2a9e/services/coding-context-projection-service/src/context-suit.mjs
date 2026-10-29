import { createHash } from "node:crypto";
import { defaultContextCandidates } from "./context-events.mjs";

function optionalText(value) { if (value === undefined || value === null) return null; const text = String(value).trim(); return text === "" ? null : text; }
function hash(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function budget(value) { const number = Number(value); return Number.isFinite(number) ? Math.max(400, Math.min(16_000, Math.round(number))) : 1600; }
function openGoal(goal) { return goal.status !== "complete" && goal.status !== "withdrawn"; }
function openWork(item) { return item.status !== "complete" && item.workStatus !== "done" && item.workStatus !== "abandoned" && item.workStatus !== "deferred"; }
function iface(bin, purpose, params) { return Object.freeze({ bin, purpose, params: Object.freeze(Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null && value !== ""))) }); }

/** Project a bounded acting context from explicit admission, goal, and work carriers. */
export function projectContextSuit(input) {
  const admission = input.admission ?? null; const goals = Array.isArray(input.goals?.goals) ? input.goals.goals : []; const work = Array.isArray(input.work?.items) ? input.work.items : [];
  const generatedAt = String(input.generatedAt ?? new Date().toISOString()); const intent = optionalText(input.intent ?? input.q) ?? admission?.intent ?? goals[0]?.text ?? "Operate against filed goals.";
  const focus = optionalText(input.focus) ?? admission?.focus ?? goals[0]?.focus ?? "sites/ops.561.group"; const agent = optionalText(input.agent) ?? "codex"; const office = optionalText(input.office) ?? (focus.toLowerCase().includes("ops") ? "operations" : "development"); const session = optionalText(input.session ?? input.session_id); const tokenBudget = budget(input.budget ?? admission?.budget);
  const candidates = new Map(); for (const item of [...defaultContextCandidates(focus), ...(admission?.candidates ?? [])]) if (!candidates.has(item.uri) || candidates.get(item.uri).weight < item.weight) candidates.set(item.uri, item);
  const ranked = [...candidates.values()].sort((a, b) => b.weight - a.weight || a.uri.localeCompare(b.uri)); const perception = Object.freeze(ranked.filter(({ tier }) => tier !== "learning").slice(0, 8)); const memory = Object.freeze(ranked.filter(({ tier }) => tier !== "sense").slice(0, 6)); const included = new Set([...perception, ...memory].map(({ uri }) => uri));
  const activeGoals = goals.filter(openGoal).slice(0, 4); const workload = Object.freeze(work.filter(openWork).filter((item) => session === null || item.session === session).slice(0, 5).map((item) => Object.freeze({ id: item.id, title: item.title, status: item.status, workStatus: item.workStatus, gate: item.gate, focus: item.focus, agent: item.agent, session: item.session, evidence: Object.freeze([...(item.evidence ?? [])].slice(0, 4)) })));
  const base = { intent, focus, office, agent, session };
  return Object.freeze({
    kind: "coding-context.suit", id: `suit:${hash({ admission: admission?.id ?? null, intent, focus, tokenBudget, generatedAt }).slice(0, 16)}`, admissionId: admission?.id ?? null, generatedAt, intent, focus, office, agent, session, budget: tokenBudget,
    identity: `Context suit for ${agent} acting from the ${office} office${session === null ? "" : ` in session ${session}`}.`,
    constraints: Object.freeze(["Context presence is not durable learning.", "File action evidence before projecting finite state.", "Keep contradictory witnesses visible until settlement.", "Project the acting agent's context, not a universal dump."]),
    capabilities: Object.freeze(["context.admit", "context.suit", "drift.assess", "goal.fold", "work.fold", "operation.fold"]), workload,
    interfaces: Object.freeze([iface("project-context-suit", "project the acting context suit", base), iface("read-work", "read scoped work before mutation", { focus, agent, session, detail: "items" }), iface("read-goals", "read durable goal state", { detail: "full" }), iface("read-operations-ledger", "read runtime witnesses", { detail: "summary" })]),
    perception, memory, omitted: Object.freeze(ranked.filter(({ uri }) => !included.has(uri))), mission: [intent, ...activeGoals.map(({ id }) => `Goal: ${id}`), ...workload.map(({ id }) => `Work: ${id}`)].join(" "), provenance: Object.freeze([...(admission?.evidence ?? []), ...activeGoals.flatMap(({ evidence = [] }) => evidence), ...workload.flatMap(({ evidence }) => evidence)]), tokenEstimate: Math.max(1, Math.ceil(JSON.stringify({ intent, focus, ranked, activeGoals, workload }).length / 4)),
  });
}
