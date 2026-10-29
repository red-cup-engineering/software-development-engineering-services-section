import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const span = (startLine, endLine = startLine) => ({ type: "RequirementsBasisSourceSpan", startLine, endLine });

function namedBullets(lines, heading, question = false) {
  const start = lines.indexOf(heading) + 1; const records = new Map(); let current;
  for (let index = start; index < lines.length && !lines[index].startsWith("## "); index += 1) {
    const match = question ? /^- `([^`]+)` \[(?:blocking|nonblocking)\]: (.+)$/u.exec(lines[index]) : /^- `([^`]+)`: (.+)$/u.exec(lines[index]);
    if (match) { current = { id: match[1].toLowerCase(), text: match[2], line: index + 1, endLine: index + 1 }; records.set(current.id, current); }
    else if (current && lines[index].trim()) { current.text += ` ${lines[index].trim()}`; current.endLine = index + 1; }
  }
  return records;
}

function bootstrapRegister(text) {
  const match = /## Machine-readable bootstrap register\n[\s\S]*?```json\n([\s\S]*?)\n```/u.exec(text);
  if (!match) throw new Error("The bootstrap document lacks its machine-readable register.");
  return JSON.parse(match[1]);
}

function marked(records, sourceMarker) {
  const record = records.get(sourceMarker);
  if (!record) throw new Error(`Register marker ${sourceMarker} does not name an authored bullet.`);
  return { statement: record.text, sourceSpan: span(record.line, record.endLine) };
}

function clauses(kind, definition, records, scope) {
  return definition.sourceMarkers.map((sourceMarker) => ({
    type: kind, version: 1, id: sourceMarker, role: definition.role, scope,
    basis: structuredClone(definition.basis), ...marked(records, sourceMarker),
  }));
}

export async function bootstrapCandidate() {
  const text = await readFile(new URL("../../specification/requirements-basis.md", import.meta.url), "utf8");
  const lines = text.split("\n"); const register = bootstrapRegister(text); const scope = register.scope;
  const authorities = namedBullets(lines, "## Authorities");
  const goals = namedBullets(lines, "## Goals");
  const expectations = namedBullets(lines, "## Expectations");
  const assumptions = namedBullets(lines, "## Domain assumptions");
  const decisions = namedBullets(lines, "## Decisions");
  const requirements = namedBullets(lines, "## Requirements");
  const prohibitions = namedBullets(lines, "## Prohibitions");
  const questions = namedBullets(lines, "## Open questions", true);
  const digest = `sha256:${createHash("sha256").update(text).digest("hex")}`;
  return {
    type: "RequirementsBasisCandidate", version: 1,
    source: { type: "RequirementsBasisSource", version: 1, identity: "artifact-fabrication-requirements-basis-bootstrap", locator: "specification/requirements-basis.md", digest, text, sourceSpan: span(1, lines.length - 1) },
    authorities: register.authorities.map(({ sourceMarker, ...record }) => ({ type: "RequirementsBasisAuthority", version: 1, ...record, scope, sourceSpan: marked(authorities, sourceMarker).sourceSpan })),
    goals: register.goals.map(({ sourceMarker, ...record }) => ({ type: "RequirementsBasisGoal", version: 1, ...record, scope, ...marked(goals, sourceMarker) })),
    expectations: register.expectations.map(({ sourceMarker, ...record }) => ({ type: "RequirementsBasisExpectation", version: 1, ...record, scope, ...marked(expectations, sourceMarker) })),
    evidence: register.evidence,
    domainAssumptions: register.domainAssumptions.map(({ sourceMarker, ...record }) => ({ type: "RequirementsBasisDomainAssumption", version: 1, ...record, scope, ...marked(assumptions, sourceMarker) })),
    decisions: register.decisions.map(({ sourceMarker, options, ...record }) => ({ type: "RequirementsBasisDecision", version: 1, ...record, options: options.map((option) => ({ type: "RequirementsBasisDecisionOption", ...option })), scope, sourceSpan: marked(decisions, sourceMarker).sourceSpan })),
    requirements: clauses("RequirementsBasisRequirement", register.requirements, requirements, scope),
    prohibitions: clauses("RequirementsBasisProhibition", register.prohibitions, prohibitions, scope),
    openQuestions: register.openQuestions.map(({ sourceMarker, ...record }) => ({ type: "RequirementsBasisOpenQuestion", version: 1, ...record, question: marked(questions, sourceMarker).statement, sourceSpan: marked(questions, sourceMarker).sourceSpan })),
    mappings: register.mappings.map((record) => ({ type: "RequirementsBasisArtifactSpecificationMapping", version: 1, ...record })),
  };
}
