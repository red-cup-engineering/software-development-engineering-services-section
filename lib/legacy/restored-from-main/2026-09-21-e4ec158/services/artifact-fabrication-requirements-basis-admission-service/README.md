# Artifact Fabrication Requirements-Basis Admission Service

`admitArtifactFabricationRequirementsBasis(candidate)` admits a small,
closed-world basis for future artifact-specification clauses. It preserves
source bytes and provenance, scope-enforcing authority, settled/proposed goals
and expectations, explicitly non-truth-laundering domain assumptions, selected
decisions, classified requirements/prohibitions, open questions, and total
reserved future-clause identifier mappings. A reserved identifier is only
syntactically checked here: target specification identity and digest validation
belong to a later projection-boundary service. Expectations and assumptions may contextualize a clause
but cannot alone make it normative; a settled goal or selected decision remains
required.

The pure core performs no I/O. It returns a deeply immutable
`RequirementsBasis@1` with a SHA-256 digest, or a deeply immutable
`RequirementsBasisRefusal@1`. Admission is neither a proof that assumptions are
true nor receiver acceptance of a fabricated artifact.

The bootstrap work order is retained in `specification/requirements-basis.md`
and is constructed and admitted by the package test suite.
