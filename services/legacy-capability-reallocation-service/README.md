# Legacy capability reallocation service

This service prevents an archive being called “processed” merely because it was read or described.
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
It refuses to run unless the archive is currently fully reallocated, deletes that exact ledger-root, and records `archiveDisposition: "purged"`.
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
`reconcile-copy-with-owner` decides each file of a copy by content address against the file's own history on both sides, followed through renames: `identical`; `owner-newer` (the copy holds a blob the owner already moved past); `copy-newer` (the owner holds a blob the copy already moved past); `merged` (both moved on from a blob they both held, and `git merge-file` applies cleanly); `conflict` (left for a person); `copy-added`; `owner-removed`; `owner-added`.
With `--apply` it writes `copy-newer`, `merged` and `copy-added` files into the owner's working tree and nothing else: nothing is deleted from an owner, and a `lib/legacy` subtree inside a copy stays where its restoration ledger names it.
After the owner has merged a wave, each copy moves under a `lib/legacy/retired-for-<owner>` directory and is inventoried, allocated `retired` with modern evidence in the owner, and verified with the commands above.
`data/forest-migration/computer-services-section.census.json` is the census of the computer-services-section forest mounted at `engineering-services-section/services/computer-services-section`.
