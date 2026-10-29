import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { admitArtifactFabricationRequirementsBasis } from "../src/admit-artifact-fabrication-requirements-basis.mjs";
import { bootstrapCandidate } from "./fixtures/bootstrap-requirements-basis.mjs";

test("dogfoods the bootstrap R1-R16 and P1-P4 basis with immutable deterministic admission", async () => {
  const first = admitArtifactFabricationRequirementsBasis(await bootstrapCandidate());
  const second = admitArtifactFabricationRequirementsBasis(await bootstrapCandidate());
  assert.equal(first.type, "RequirementsBasis");
  assert.equal(first.digest, second.digest);
  assert.deepEqual(first.mappings.map(({ subjectId }) => subjectId).sort(), [...first.requirements, ...first.prohibitions].map(({ id }) => id).sort());
  assert.equal(first.goals[0].type, "RequirementsBasisGoal");
  assert.equal(first.domainAssumptions[0].type, "RequirementsBasisDomainAssumption");
  assert.equal(first.decisions[0].type, "RequirementsBasisDecision");
  assert.ok(Object.isFrozen(first)); assert.ok(Object.isFrozen(first.requirements)); assert.ok(Object.isFrozen(first.requirements[0].basis));
  const lines = (await readFile(new URL("../specification/requirements-basis.md", import.meta.url), "utf8")).split("\n");
  const expectedSpan = (id) => {
    const start = lines.findIndex((line) => line.toLowerCase().startsWith(`- \`${id}\``)); let end = start;
    for (let index = start + 1; index < lines.length && !lines[index].startsWith("- `") && !lines[index].startsWith("## "); index += 1) if (lines[index].trim()) end = index;
    return { startLine: start + 1, endLine: end + 1 };
  };
  for (const item of [...first.authorities, ...first.goals, ...first.expectations, ...first.domainAssumptions, ...first.decisions, ...first.requirements, ...first.prohibitions, ...first.openQuestions]) {
    assert.deepEqual(item.sourceSpan, { type: "RequirementsBasisSourceSpan", ...expectedSpan(item.id) }, item.id);
  }
});

test("the fixture takes semantic records only from the authored bootstrap register", async () => {
  const fixture = await readFile(new URL("./fixtures/bootstrap-requirements-basis.mjs", import.meta.url), "utf8");
  for (const authoredIdentifier of ["preserve-normative-origin", "small-first-model", "r1-source-provenance", "p1-no-truth-laundering", "q4-projection-boundary"]) {
    assert.doesNotMatch(fixture, new RegExp(authoredIdentifier, "u"), authoredIdentifier);
  }
  assert.match(fixture, /bootstrapRegister\(text\)/u);
  assert.match(fixture, /register\.(?:authorities|goals|expectations|domainAssumptions|decisions|requirements|prohibitions|openQuestions|mappings)/u);
});

test("refuses every bootstrap acceptance-obligation defect", async () => {
  const cases = [
    ["UNEXPECTED_FIELDS", (candidate) => { candidate.unexpected = true; }],
    ["SOURCE_DIGEST_MISMATCH", (candidate) => { candidate.source.text += "changed"; }],
    ["UNAUTHORIZED_RECORD", (candidate) => { candidate.goals[0].authorityId = "missing"; }],
    ["UNAUTHORIZED_RECORD", (candidate) => { candidate.expectations[0].authorityId = "missing"; }],
    ["SCOPE_MISMATCH", (candidate) => { candidate.expectations[0].scope = "other-scope"; }],
    ["UNSUPPORTED_ASSUMPTION", (candidate) => { candidate.domainAssumptions[0].status = "supported"; }],
    ["UNKNOWN_EVIDENCE", (candidate) => { candidate.domainAssumptions[0].evidenceIds = ["missing-evidence"]; }],
    ["UNRESOLVED_REFERENCE", (candidate) => { candidate.requirements[0].basis.goalIds = ["missing"]; }],
    ["UNACCOUNTABLE_BASIS", (candidate) => { candidate.requirements[0].basis.goalIds = []; candidate.requirements[0].basis.decisionIds = []; }],
    ["SCOPE_MISMATCH", (candidate) => { candidate.requirements[0].scope = "other-scope"; }],
    ["INVALID_CLAUSE", (candidate) => { candidate.requirements[0].role = "unknown-role"; }],
    ["SOURCE_EXTENT_MISMATCH", (candidate) => { candidate.source.sourceSpan.endLine -= 1; }],
    ["SOURCE_SPAN_OUT_OF_RANGE", (candidate) => { candidate.requirements[0].sourceSpan.endLine = candidate.source.sourceSpan.endLine + 1; }],
    ["INCOMPLETE_MAPPING", (candidate) => { candidate.mappings.pop(); }],
    ["INVALID_ID", (candidate) => { candidate.mappings[0].artifactSpecificationClauseIds = ["R1-not-normalized"]; }],
    ["MISSING_NORMATIVE_CLAUSES", (candidate) => { candidate.requirements = []; candidate.prohibitions = []; candidate.mappings = []; }],
    ["BLOCKING_OPEN_QUESTION", (candidate) => { candidate.openQuestions[0].blocking = true; }],
  ];
  for (const [code, mutate] of cases) { const candidate = await bootstrapCandidate(); mutate(candidate); const refused = admitArtifactFabricationRequirementsBasis(candidate); assert.equal(refused.code, code); assert.ok(Object.isFrozen(refused)); }
});

test("implementation purity excludes I/O, process, time, random, and environment imports", async () => {
  const source = await readFile(new URL("../src/admit-artifact-fabrication-requirements-basis.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:(?:fs|child_process|http|https|net|timers)|\bprocess\.|Date\.|Math\.random|import\.meta\.env/u);
});
