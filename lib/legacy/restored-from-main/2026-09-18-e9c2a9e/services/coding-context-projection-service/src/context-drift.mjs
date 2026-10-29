export const CONTEXT_DRIFT_METRICS = Object.freeze([
  "goal-alignment",
  "context-support",
  "authority-fit",
  "scope-fit",
  "memory-pollution",
  "contradiction-pressure",
  "compression-loss",
  "obstruction-honesty",
]);

export function assessContextDrift(input) {
  const intent = requiredText(input?.intent, "assessment intent");
  const action = requiredText(input?.action, "assessment action");
  if (input?.suit === null || typeof input?.suit !== "object" || Array.isArray(input.suit)) {
    throw new TypeError("assessment suit is required");
  }
  const normalized = Object.freeze({
    intent,
    action,
    tool: optionalText(input.tool),
    paths: stringList(input.paths),
    outcome: optionalText(input.outcome),
    focus: optionalText(input.focus),
    suit: input.suit,
    authority: optionalText(input.authority) ?? "user",
  });
  const metrics = contextDriftMetrics(normalized);
  const score = Math.round(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length);
  return Object.freeze({
    kind: "coding-context.drift-assessment",
    intent,
    action,
    focus: normalized.focus ?? optionalText(normalized.suit.focus),
    metrics,
    score,
    drift: metrics.some((item) => item.value === "drift") || score < 70,
    regime: contextDriftRegime(action, normalized.outcome, metrics),
  });
}

export function contextDriftMetrics(input) {
  const haystack = searchable([input.action, input.tool, input.outcome, ...input.paths]);
  const intentTerms = terms(input.intent).filter((term) => term.length > 3);
  const suitTerms = terms([input.suit.intent, input.suit.mission, input.suit.focus ?? ""].join(" ")).filter((term) => term.length > 3);
  const focus = input.focus ?? optionalText(input.suit.focus);
  const contextHits = [...intentTerms, ...suitTerms].filter((term) => haystack.includes(term)).length;
  const touchesMemory = /\b(memory|memories|rememberContext|learning|consolidat)/iu.test(haystack);
  const isConsolidation = /\b(consolidat|settle|study|accepted truth)\b/iu.test(haystack);
  const isCompaction = /\b(compact|summary|summarize)\b/iu.test(haystack);
  const mentionsGoal = /\bgoal|read-workitem|intent|constraint|evidence\b/iu.test(haystack);
  const claimsDone = doneText(haystack);
  const boundHit = BOUND_RE.test(haystack);
  const substituted = boundHit && claimsDone && !HONEST_RE.test(haystack);
  return Object.freeze([
    metric("goal-alignment", contextHits > 0 ? "aligned" : "watch", contextHits > 0 ? 90 : 55, contextHits > 0 ? "action shares terms with filed intent or suit mission" : "action does not visibly cite filed intent or mission"),
    metric("context-support", contextHits > 1 ? "aligned" : "watch", contextHits > 1 ? 88 : 60, contextHits > 1 ? "action is supported by admitted context terms" : "context support is weak and should be backed by evidence"),
    metric("authority-fit", /^(user|hook|mcp|automation|heartbeat|operations-manifold)/iu.test(input.authority) ? "aligned" : "watch", 80, `authority ${input.authority} is recorded for later governance`),
    metric("scope-fit", scopeFits(input.paths, focus) ? "aligned" : "drift", scopeFits(input.paths, focus) ? 92 : 25, scopeFits(input.paths, focus) ? "touched paths fit admitted focus or no paths were supplied" : "touched paths escape admitted focus"),
    metric("memory-pollution", touchesMemory && !isConsolidation ? "drift" : "aligned", touchesMemory && !isConsolidation ? 30 : 92, touchesMemory && !isConsolidation ? "action appears to write memory outside a consolidation/study path" : "no direct memory pollution signal"),
    metric("contradiction-pressure", /\b(conflict|contradict|top|absurd|gap|unsettled)\b/iu.test(haystack) ? "watch" : "aligned", 76, "contradiction language is preserved as pressure rather than silently resolved"),
    metric("compression-loss", isCompaction && !mentionsGoal ? "drift" : "aligned", isCompaction && !mentionsGoal ? 35 : 90, isCompaction && !mentionsGoal ? "compaction lacks visible goal/constraint/evidence anchors" : "no compaction-loss signal"),
    metric("obstruction-honesty", substituted ? "drift" : boundHit && claimsDone ? "watch" : "aligned", substituted ? 20 : boundHit && claimsDone ? 60 : boundHit ? 85 : 90,
      substituted ? "outcome claims completion while evidence shows a bound was hit - an obstruction reported as a settled claim"
        : boundHit && claimsDone ? "outcome claims completion but also names a bound; report the obstruction explicitly, do not present the proxy as settled"
          : boundHit ? "a bound is present and is not dressed up as completion" : "no obstruction-substitution signal"),
  ]);
}

export function contextDriftRegime(action, outcome, metrics) {
  if (metrics.find((item) => item.name === "contradiction-pressure")?.value !== "aligned") return "contested";
  const text = `${action} ${outcome ?? ""}`;
  if (BOUND_RE.test(text)) return "obstructed";
  if (doneText(text)) return "stabilized";
  return null;
}

function metric(name, value, score, reason) {
  return Object.freeze({ name, value, score, reason });
}

const DONE_RE = /\b(done|complete|completed|finished|fixed|read-works?|read-working|passing|green|stabiliz\w*|succe\w+|shipped|resolved|ready)\b/iu;
const BOUND_RE = /\b(block\w*|den\w+|refus\w+|cannot|can['’]?t|could\s?n['’]?t|could not|unable|missing|not\s+(?:found|exported|defined)|undefined|crash\w*|fail\w*|50[023]|timed?\s?out|timeout|gave up|dead|down|unavailable|instead|proxy|substitut\w*|stuck|halt\w*)\b/iu;
const HONEST_RE = /\b(obstruct\w*|bound|halted|blocked by|out of scope|not done|incomplete|deferred|awaiting|needs?\s+(?:approval|authorization|sign-?off))\b/iu;
const NOT_DONE_RE = /\b(?:not|isn['’]?t|aren['’]?t|wasn['’]?t|never|no)\s+(?:yet\s+)?(?:done|complete\w*|finish\w*|fix\w*|ready|read-working|resolved|shipped|passing|green)\b|\b(?:incomplete|unfinished|unresolved)\b/iu;

function doneText(value) {
  return DONE_RE.test(value) && !NOT_DONE_RE.test(value);
}

function scopeFits(paths, focus) {
  if (paths.length === 0 || focus === null || !focus.includes("/")) return true;
  const normalized = focus.replace(/\/+$/u, "");
  return paths.every((item) => item === normalized || item.startsWith(`${normalized}/`));
}

function terms(value) {
  return String(value ?? "").toLowerCase().split(/[^a-z0-9]+/u).filter(Boolean);
}

function searchable(values) {
  return values.filter((value) => typeof value === "string").join(" ").toLowerCase();
}

function stringList(value) {
  if (value === undefined) return Object.freeze([]);
  if (Array.isArray(value)) return Object.freeze(value.map(String).map((item) => item.trim()).filter(Boolean));
  return Object.freeze(String(value).split(/\r?\n|,/u).map((item) => item.trim()).filter(Boolean));
}

function requiredText(value, label) {
  const text = optionalText(value);
  if (text === null) throw new TypeError(`${label} is required`);
  return text;
}

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}
