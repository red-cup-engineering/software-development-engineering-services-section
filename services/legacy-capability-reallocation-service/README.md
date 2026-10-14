# Legacy capability reallocation service

This service prevents an archive being called “processed” merely because it was read or described.
Integration flows from legacy into living owners. `retire-wave --write` uses the
existing reconciler to integrate its selected wave into those owners.
It inventories every source carrier below a supplied legacy root, derives explicit carrier and destination candidates from the source itself, and writes a ledger whose records begin `unallocated`.

A record becomes `retired` only when it names a modern, non-legacy implementation witness and the verifier finds no remaining non-legacy route to that archive source.
A family is `fully-reallocated` only when every discovered source carrier is retired.
New or changed archive files invalidate that result.

When a legacy file is itself the carrier that must survive, an allocation may also declare a `materializations` entry with its `sourcePath` and modern `destinationPath`.
`materialize-legacy-capability-carriers` moves only those declared files after checking their ledger SHA-256 identity.
The verifier then accepts the source's absence from the archive only if exactly one retired materialization exists and its modern bytes still match the original carrier.

The service owns migration accountability for code.
It does not decide the domain meaning of a scientific document, nor does it copy code between services.
The ledger makes those decisions and their evidence durable so an agent can continue the reallocation without asking a person to reconstruct the previous audit.

```sh
inventory-legacy-capabilities path/to/lib/legacy/project --write data/project.ledger.json
allocate-legacy-capabilities data/project.ledger.json data/project.allocations.json
materialize-legacy-capability-carriers data/project.ledger.json --repo-root /home/emsenn/info
verify-legacy-capability-reallocation data/project.ledger.json --repo-root /home/emsenn/info
purge-legacy-capability-archive data/project.ledger.json --repo-root /home/emsenn/info
```

`readArchiveDirectories` reads the directories named `archive` or `_archive` among repository-relative file paths, as a tracked listing gives them, each with the archive enclosing it and the legacy root holding it, named as a ledger names its `legacyRoot`.
An archive outside every legacy root is legacy material that no ledger can inventory until it is placed under one.

For every Markdown record, the carrier home is the canonical Markdown engineering section downstream of SignCell.
A scientific or organizational subject owner may additionally be proposed; that never relocates the Markdown carrier machinery into a system application.

Allocation declarations name an effect, carrier, destination, state, and the one or more discovered source paths that evidence it.
The allocation command rejects unknown source paths, and the verifier rejects any archive source that is not covered by a declaration; an agent cannot mark a whole package complete while leaving one of its source effects unaccounted.

`purge-legacy-capability-archive` is destructive.
It verifies the current ledger, deletes that exact ledger-root, and records `archiveDisposition: "purged"`. Source verification alone does not establish useful consumer receiving.
The verifier then continues to check the ledger's original source hashes, retired witnesses, and any required byte-preserved materializations; an absent archive without that disposition is still a verification failure.

## Restorations from history

`data/main-history-loss-forensics.json` records every first-parent commit of main that deleted content no longer present at HEAD, with its pull request, date and title, and how much of what it deleted survives edited at HEAD, was restored from history, exists in an owner repository, or was not restored (generated data, caches, build output, trivial files).
Each `data/restorations/*.ledger.json` names the files one restoration returned byte-for-byte from history under a legacy tree: original path, restored path, git blob, SHA-256, mode, and the deleting commit.
`data/legacy-unit-inventory.json` lists every legacy unit with source code, its languages, tests, package names and any active package of the same name; a unit's `activation` stays `pending` until its capability is carried into its owner and that migration is recorded here.

## Copies retired for their owners

A package defined both here and in a repository that owns it (DRC-2, one owner) is reconciled into the owner and its copy here retired, wave by wave.

```sh
census-owned-copies --owner-forest <mounted owner> --copy-repo <this repository> --open-pr-files <changed files of open pull requests> --write data/forest-migration/<owner>.census.json
reconcile-wave --census data/forest-migration/<owner>.census.json --wave <n> --copy-repo <this repository> --owner-root <owner/repository=dir>... --reports <dir> [--apply]
```

The census names each shared package's owner (repository and path), each copy here, whether it is byte-identical, its dependency level, and the open pull requests that touch it (such a copy is held until they are rehomed).
Waves are whole dependency levels, leaves first.
`reconcile-copy-with-owner` reads exact Git blobs and path histories. Selected copy-only source is integrated even when the owner previously deleted it. `--copy-revision <commit>` reads historical source directly, avoiding another `restored-from-main` copy. `--resolutions` supplies per-path `{keep: "owner" | "copy", because: "the sourced judgment"}` decisions.
With `--apply`, clean files proceed independently of other conflicts. Concurrent owner edits are merged with the selected changes; overlapping edits remain intact and appear as `worktree-conflict`. Executable and symbolic-link modes are preserved. A wave may supply each copy's `revision` in its existing census.
`retire-wave --write` composes that same integration operation for the selected wave. It writes into the mounted living owners rather than moving files into legacy or rewriting workspace admission. Remaining conflicting source stays available for continued integration.
`data/forest-migration/computer-services-section.census.json` is the census of the computer-services-section forest mounted at `engineering-services-section/services/computer-services-section`.
