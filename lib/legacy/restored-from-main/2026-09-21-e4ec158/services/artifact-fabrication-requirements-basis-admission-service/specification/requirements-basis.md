---
title: "Artifact fabrication requirements-basis admission"
description: "Bootstrap requirements for admitting the accountable basis from which settled artifact-fabrication requirements are derived."
type: bootstrap-requirements-basis
status: settled-for-bootstrap
date-created: 2026-08-28
---


## Problem world and machine boundary

The repository can admit a settled artifact-fabrication specification, but it
does not yet represent why a clause became a requirement. Stakeholder goals,
claims about the external domain, authorized design decisions, standards,
assays, and acceptance can therefore be compressed into an undifferentiated
trace.

The machine introduced by this work order admits an already-structured
requirements-basis candidate. It does not elicit requirements, decide among
alternatives, establish that a domain assumption is true, fabricate an artifact,
or accept a realization.

## Authorities

- `owner`: the repository owner may settle bootstrap goals and design decisions
  for this alpha capability.
- `requirements-basis-admitter`: the service may check the closed contract and
  return an admitted immutable value or a typed refusal. It may not exercise the
  owner's decision or acceptance authority.

## Goals

- `preserve-normative-origin`: preserve an inspectable account of why every
  settled requirement or prohibition is normative.
- `keep-world-and-machine-distinct`: keep descriptive assumptions about an
  external problem world distinct from obligations assigned to a fabricated
  artifact.
- `support-later-specification-fabrication`: produce a stable admitted basis
  that a later projector can translate into an artifact-fabrication
  specification without silently inventing missing decisions.

## Domain assumptions

- `structured-candidate-upstream`: an upstream author or translator supplies a
  structured candidate. Natural-language extraction is outside this service.
- `digest-identifies-source-bytes`: a lowercase SHA-256 digest identifies the
  exact source bytes offered to admission; it does not establish their truth.
- `authority-is-declared-not-proved`: an authority record declares scoped
  responsibility for this circuit. Authentication and institutional
  authorization are outside this alpha service.

## Expectations

- `upstream-structure-available`: the upstream author or translator is expected
  to supply structured input for this circuit; this expectation is not an
  artifact obligation by itself.

## Decisions

- `closed-records`: use exact, versioned, closed-world records and refuse
  unknown fields rather than silently preserving or guessing at them.
- `small-first-model`: admit authorities, goals, domain assumptions, decisions,
  requirements, prohibitions, open questions, and specification-clause
  mappings. Defer general assurance-case and receiver-acceptance models.
- `explicit-bootstrap`: preserve this document as the pre-implementation
  bootstrap source, then require the implemented service to admit a structured
  representation of it in its own verification suite.
- `no-formal-proof-claim`: call referential and trace checks admission laws, not
  refinement proofs or proof of truth.
- `scoped-records`: every governed record carries the exact bootstrap scope and
  every basis relation stays inside that scope.
- `classified-clauses`: every normative clause declares whether it is a world
  requirement, machine guarantee, standards obligation, internal law, or
  operational decision.
- `bound-source-bytes`: admission receives exact source text and verifies its
  SHA-256 digest and whole-document span before relying on cited spans.

## Requirements

- `R1-source-provenance`: admission MUST preserve source identity, locator,
  lowercase SHA-256 digest, and exact source spans.
- `R2-authority-scope`: every goal and decision MUST name an existing authority
  whose declared scope permits that role; expectations MUST do the same.
- `R3-distinct-record-kinds`: goals, domain assumptions, decisions,
  expectations, requirements, prohibitions, and open questions MUST remain distinct record
  kinds in the admitted value.
- `R4-accountable-basis`: every requirement and prohibition MUST trace to at
  least one settled goal or selected decision. A domain assumption MAY be part
  of the basis but MUST NOT alone create a normative obligation.
- `R5-domain-support`: every domain assumption MUST identify immutable source
  evidence or be explicitly marked `hypothesis`; a digest MUST NOT be described
  as proof that the assumption is true.
- `R6-decision-closure`: every selected decision MUST identify its issue,
  alternatives, selected alternative, rationale, and scoped deciding authority.
- `R7-reference-closure`: all identifiers MUST be unique within their kind and
  every reference MUST resolve to an admitted record.
- `R8-blocking-questions`: a blocking open question MUST cause typed refusal
  before an admitted basis is returned.
- `R9-projection-readiness`: every requirement and prohibition MUST reserve at
  least one syntactically valid future artifact-specification clause identifier;
  this alpha does not yet identify or validate a target specification.
- `R10-determinism-and-purity`: equal candidates MUST produce equal canonical
  digests and structurally equal results without filesystem, network, process,
  clock, random, or environment access.
- `R11-immutability`: every successful result and typed refusal MUST be deeply
  immutable.
- `R12-bootstrap-dogfood`: the verification suite MUST admit a structured
  representation of this document and demonstrate complete requirement and
  prohibition mappings.
- `R13-expectation-nonnormativity`: expectations MUST be first-class scoped
  records and MAY contextualize a clause but MUST NOT alone make it normative.
- `R14-scope-closure`: every authority-governed record and every basis relation
  MUST remain in the exact declared scope of its authority and clause.
- `R15-clause-role-classification`: every requirement and prohibition MUST carry
  one closed role selected from world requirement, machine guarantee, standards
  obligation, internal law, or operational decision.
- `R16-source-byte-binding`: admission MUST receive source text, verify its
  lowercase SHA-256 digest and exact whole-document extent, and refuse cited
  spans outside that extent.

## Prohibitions

- `P1-no-truth-laundering`: the service MUST NOT treat provenance, a digest, or
  declared evidence as proof that a domain claim is true.
- `P2-no-goal-laundering`: the service MUST NOT silently promote a proposed goal
  or preference into a settled requirement.
- `P3-no-acceptance-laundering`: the service MUST NOT represent admission,
  fabrication success, or assay evidence as receiver acceptance.
- `P4-no-universal-ontology-claim`: the service MUST NOT claim that its bootstrap
  record family is a complete ontology of requirements engineering.

## Acceptance obligations

- A positive assay admits this bootstrap basis, preserves every record-kind
  distinction, resolves every reference, maps `R1` through `R16` and `P1`
  through `P4`, returns a stable digest, and deeply freezes the result.
- Negative assays refuse an unknown field, unauthorized goal owner,
  assumption without evidence or hypothesis status, unresolved reference,
  requirement based only on a domain assumption, incomplete mapping, and
  blocking open question; they also refuse unauthorized or mis-scoped
  expectations, invalid clause roles, source extent mismatches, and cited spans
  outside source text.
- A purity assay statically confirms that the implementation imports no I/O,
  process, clock, random, or environment capability.

## External grounding

- Pamela Zave and Michael Jackson, [Four Dark Corners of Requirements
  Engineering](https://www.fceia.unr.edu.ar/asist/zave00.pdf): distinguishes
  requirements, domain knowledge, and machine specification.
- Axel van Lamsweerde, [Goal-Driven Requirements Engineering: the KAOS
  Approach](https://webperso.info.ucl.ac.be/~avl/gore.php): distinguishes goals,
  requirements, expectations, obstacles, refinement, and agent assignment.
- W3C, [PROV-DM](https://www.w3.org/TR/prov-dm/): distinguishes entities,
  activities, agents, derivation, and responsibility while making no truth
  judgment.
- OMG, [Structured Assurance Case Metamodel 2.3](https://www.omg.org/spec/SACM):
  keeps claims, argumentation, and evidence distinct in assurance cases.
- ISO, [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html): treats
  requirements engineering as lifecycle processes and information items; the
  full normative text was not available for this bootstrap work.

## Open questions

- `Q1-assurance-arguments` [nonblocking]: Which minimal argument record should
  connect realization evidence to an acceptance claim without importing the
  whole SACM metamodel?
- `Q2-refinement-witnesses` [nonblocking]: Which preservation witness should
  connect an admitted requirements basis to a projected artifact specification?
- `Q3-authenticated-authority` [nonblocking]: Which system should authenticate
  authority and delegation records beyond this alpha's declared scopes?
- `Q4-projection-boundary` [nonblocking]: Which admitted target specification
  identity and digest should validate the reserved future clause identifiers?

## Machine-readable bootstrap register

This closed register is the semantic source for the dogfood candidate. Its
`sourceMarker` values name the authored Markdown bullets above; the fixture
parses this register and derives only their exact text, digest, and spans from
the source document.

```json
{
  "type": "RequirementsBasisBootstrapRegister",
  "version": 1,
  "scope": "artifact-fabrication-requirements-basis-bootstrap",
  "authorities": [{"id": "owner", "roles": ["goal-settlement", "expectation-settlement", "decision-settlement"], "sourceMarker": "owner"}],
  "goals": [
    {"id": "preserve-normative-origin", "status": "settled", "authorityId": "owner", "sourceMarker": "preserve-normative-origin"},
    {"id": "keep-world-and-machine-distinct", "status": "settled", "authorityId": "owner", "sourceMarker": "keep-world-and-machine-distinct"},
    {"id": "support-later-specification-fabrication", "status": "settled", "authorityId": "owner", "sourceMarker": "support-later-specification-fabrication"}
  ],
  "expectations": [{"id": "upstream-structure-available", "status": "settled", "authorityId": "owner", "sourceMarker": "upstream-structure-available"}],
  "evidence": [],
  "domainAssumptions": [
    {"id": "structured-candidate-upstream", "status": "hypothesis", "evidenceIds": [], "sourceMarker": "structured-candidate-upstream"},
    {"id": "digest-identifies-source-bytes", "status": "hypothesis", "evidenceIds": [], "sourceMarker": "digest-identifies-source-bytes"},
    {"id": "authority-is-declared-not-proved", "status": "hypothesis", "evidenceIds": [], "sourceMarker": "authority-is-declared-not-proved"}
  ],
  "decisions": [
    {"id": "closed-records", "issue": "How should records be represented?", "options": [{"id": "selected", "statement": "Use exact, versioned closed-world records."}, {"id": "open", "statement": "Preserve unknown fields."}], "selectedOptionId": "selected", "rationale": "The authored decision rejects silent preservation and guessing.", "authorityId": "owner", "sourceMarker": "closed-records"},
    {"id": "small-first-model", "issue": "What basis model is admitted?", "options": [{"id": "small-model", "statement": "Admit the named bootstrap record families."}, {"id": "universal-model", "statement": "Model all requirements-engineering concepts."}], "selectedOptionId": "small-model", "rationale": "Defer general assurance and acceptance models.", "authorityId": "owner", "sourceMarker": "small-first-model"},
    {"id": "explicit-bootstrap", "issue": "How is the source retained?", "options": [{"id": "selected", "statement": "Retain and dogfood this bootstrap document."}], "selectedOptionId": "selected", "rationale": "The verification suite admits its structured representation.", "authorityId": "owner", "sourceMarker": "explicit-bootstrap"},
    {"id": "no-formal-proof-claim", "issue": "What strength of claim is made?", "options": [{"id": "selected", "statement": "Call referential checks admission laws, not proofs."}], "selectedOptionId": "selected", "rationale": "Truth and refinement are outside this alpha.", "authorityId": "owner", "sourceMarker": "no-formal-proof-claim"},
    {"id": "scoped-records", "issue": "How are records related?", "options": [{"id": "selected", "statement": "Require exact scope closure."}], "selectedOptionId": "selected", "rationale": "No governed relation crosses this bootstrap scope.", "authorityId": "owner", "sourceMarker": "scoped-records"},
    {"id": "classified-clauses", "issue": "How are normative clauses distinguished?", "options": [{"id": "selected", "statement": "Use the closed clause-role classification."}], "selectedOptionId": "selected", "rationale": "Clause roles must be explicit and closed.", "authorityId": "owner", "sourceMarker": "classified-clauses"},
    {"id": "bound-source-bytes", "issue": "How are cited source claims bounded?", "options": [{"id": "selected", "statement": "Verify source bytes, digest, and extent."}], "selectedOptionId": "selected", "rationale": "Cited spans rely on exact offered source text.", "authorityId": "owner", "sourceMarker": "bound-source-bytes"}
  ],
  "requirements": {"role": "machine-guarantee", "basis": {"goalIds": ["preserve-normative-origin"], "expectationIds": ["upstream-structure-available"], "decisionIds": ["small-first-model"], "domainAssumptionIds": ["structured-candidate-upstream"]}, "sourceMarkers": ["r1-source-provenance", "r2-authority-scope", "r3-distinct-record-kinds", "r4-accountable-basis", "r5-domain-support", "r6-decision-closure", "r7-reference-closure", "r8-blocking-questions", "r9-projection-readiness", "r10-determinism-and-purity", "r11-immutability", "r12-bootstrap-dogfood", "r13-expectation-nonnormativity", "r14-scope-closure", "r15-clause-role-classification", "r16-source-byte-binding"]},
  "prohibitions": {"role": "operational-decision", "basis": {"goalIds": ["preserve-normative-origin"], "expectationIds": ["upstream-structure-available"], "decisionIds": ["small-first-model"], "domainAssumptionIds": ["structured-candidate-upstream"]}, "sourceMarkers": ["p1-no-truth-laundering", "p2-no-goal-laundering", "p3-no-acceptance-laundering", "p4-no-universal-ontology-claim"]},
  "openQuestions": [
    {"id": "q1-assurance-arguments", "blocking": false, "sourceMarker": "q1-assurance-arguments"},
    {"id": "q2-refinement-witnesses", "blocking": false, "sourceMarker": "q2-refinement-witnesses"},
    {"id": "q3-authenticated-authority", "blocking": false, "sourceMarker": "q3-authenticated-authority"},
    {"id": "q4-projection-boundary", "blocking": false, "sourceMarker": "q4-projection-boundary"}
  ],
  "mappings": [
    {"subjectId": "r1-source-provenance", "artifactSpecificationClauseIds": ["r1-source-provenance"]}, {"subjectId": "r2-authority-scope", "artifactSpecificationClauseIds": ["r2-authority-scope"]}, {"subjectId": "r3-distinct-record-kinds", "artifactSpecificationClauseIds": ["r3-distinct-record-kinds"]}, {"subjectId": "r4-accountable-basis", "artifactSpecificationClauseIds": ["r4-accountable-basis"]}, {"subjectId": "r5-domain-support", "artifactSpecificationClauseIds": ["r5-domain-support"]}, {"subjectId": "r6-decision-closure", "artifactSpecificationClauseIds": ["r6-decision-closure"]}, {"subjectId": "r7-reference-closure", "artifactSpecificationClauseIds": ["r7-reference-closure"]}, {"subjectId": "r8-blocking-questions", "artifactSpecificationClauseIds": ["r8-blocking-questions"]}, {"subjectId": "r9-projection-readiness", "artifactSpecificationClauseIds": ["r9-projection-readiness"]}, {"subjectId": "r10-determinism-and-purity", "artifactSpecificationClauseIds": ["r10-determinism-and-purity"]}, {"subjectId": "r11-immutability", "artifactSpecificationClauseIds": ["r11-immutability"]}, {"subjectId": "r12-bootstrap-dogfood", "artifactSpecificationClauseIds": ["r12-bootstrap-dogfood"]}, {"subjectId": "r13-expectation-nonnormativity", "artifactSpecificationClauseIds": ["r13-expectation-nonnormativity"]}, {"subjectId": "r14-scope-closure", "artifactSpecificationClauseIds": ["r14-scope-closure"]}, {"subjectId": "r15-clause-role-classification", "artifactSpecificationClauseIds": ["r15-clause-role-classification"]}, {"subjectId": "r16-source-byte-binding", "artifactSpecificationClauseIds": ["r16-source-byte-binding"]}, {"subjectId": "p1-no-truth-laundering", "artifactSpecificationClauseIds": ["p1-no-truth-laundering"]}, {"subjectId": "p2-no-goal-laundering", "artifactSpecificationClauseIds": ["p2-no-goal-laundering"]}, {"subjectId": "p3-no-acceptance-laundering", "artifactSpecificationClauseIds": ["p3-no-acceptance-laundering"]}, {"subjectId": "p4-no-universal-ontology-claim", "artifactSpecificationClauseIds": ["p4-no-universal-ontology-claim"]}
  ]
}
```
