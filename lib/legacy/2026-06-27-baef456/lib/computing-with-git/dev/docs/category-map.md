# computing-with-git category map

This package computes with version control by admitting git-on-disk evidence into relational carriers, deriving readings from those carriers, and keeping representation and I/O at their own boundaries.
It is a categorical member of the `computing-with-*` family, the same shape as `@emsenn/organizing-with-jsnode`: admit domain evidence, settle it, read it; never re-roll the charge algebra.

## Base

The base object is not a `git status` line, a commit hash, a refname, or a remote URL.
The base object is a **git relational carrier** whose facts normalize to:

```text
repository evidence
-> relational carrier
-> Mark
-> Utterance
-> settled observation / derived reading
```

The persistent form is the repository on disk: its working tree, index, object database, refs, and remotes.
The porcelain git prints is the durable representation of that state; the carrier is the ontology, not the porcelain.

A fact enters only as an utterance (`gitFact` in `computing/facts`), exactly as `@emsenn/relating` prescribes.
Charges are never seeded — they are settled by `@emsenn/computing`'s `compute` over the carrier's observed facts, or measured on the holography boundary (the dirtiness reading).

## Layer Stack

### worktree

Role: the working-tree state carrier (`computing/worktree`).

Capability: admits decoded short-status evidence into a carrier — one utterance per changed path, predicated by its XY code — and derives the staged, unstaged, and untracked partitions plus the dirtiness charge measured on the holography boundary.

### objects

Role: the commit-object graph carrier (`computing/objects`).

Capability: admits decoded commit evidence into a carrier — one utterance per parent edge — so the commit DAG is a settled topology; derives the tip, the root commits, and the merge commits.

### refs

Role: the ref carrier (`computing/refs`).

Capability: admits decoded refs into a carrier, predicated by kind (branch/remote/tag/head); derives the branch, tag, and kind partitions.

### remotes

Role: the remote carrier (`computing/remotes`).

Capability: admits decoded remotes into a carrier; derives the named lookup of a remote's fetch/push URLs.

## Boundaries

### compute

Role: the git computer admission surface (`computing/index`, exported as `./compute`).

Capability: admits a version-control action (`worktree.status`, `log.read`, `refs.read`, `remotes.read`) against a repository token, projects the requested evidence through the holography, admits it into the matching layer carrier, and returns a charged `GitComputerAdmission` — the action, the upstream `ComputingAdmission` it reduces to, the carrier's utterances, and the derived reading or charged obstruction.
Every action is a member of the finite `GIT_COMPUTER_ACTIONS` vocabulary; every result is a charged reading or obstruction.
The root charge is delegated to `@emsenn/computing`; git observes its facts and lets computing settle them.

### codecs

Role: representation boundaries (`codecs/`, exported as `./codecs`).

Capability: decodes each git porcelain stream — short status, commit log (`LOG_PRETTY_FORMAT`), refs, remotes — into structured entries.
Pure representation: no exec, no fetch, no settling.
The format a holography projection produces is declared beside its decoder so producer and decoder never drift.

### holography

Role: the I/O host (`holography/`, exported as `./holography`).

Capability: the only module that shells out to git.
Each read is one git subcommand decoded through one codec; the `GitExec` is injectable so every projection can be witnessed without a live repo.
The dirtiness charge is the lone derived reading on the boundary itself — measured from what git reports, never seeded.

## Package-bin surface

Two bins project the package's pure functions over stdin/stdout, the family transport shape:

- `git-status` — the I/O edge of the holography: shell out to a repo, or decode porcelain text from stdin, and emit the decoded entries plus the dirtiness charge.
- `git-compute` — a thin projection over `computeWithGit`: run an action against a repository and emit the admission's status charge plus the carrier's git utterances as EAVT rows.

## Consolidation Rule

Do not delete a capability.
Move it only when its domain, codomain, and carrier descent identify the target layer.
Keep a module only if it is one of: carrier constructor, morphism/strategy, derived reading, boundary witness, finite vocabulary, or obstruction/admission surface.
A helper for one of those stays private to that object.
