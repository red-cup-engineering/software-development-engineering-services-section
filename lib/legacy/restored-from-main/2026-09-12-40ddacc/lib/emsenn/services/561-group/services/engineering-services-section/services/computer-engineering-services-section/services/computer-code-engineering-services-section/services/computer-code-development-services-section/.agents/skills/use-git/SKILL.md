---
name: use-git
description: How to do git work in this tree directly — status, staging, committing, history, untangling a shared dirty working tree. Load before any git operation beyond a read-only `git status`/`git log`/`git diff`.
---
<!-- Generated from @red-cup-engineering/agent-root-instructions-projection-service/content/skills/use-git/SKILL.md. Edit the package source. -->

# Use git

Do this work yourself, in the main loop, with the `Bash` tool. Git is not a
reason to dispatch an agent.

## Routine, bounded change (the default)

Use the house operator, per `.agents/rules/work-completion.md`:

```
node lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-code-engineering-services-section/services/computer-code-development-services-section/services/version-control-services-section/services/git-services-section/services/committing-git-paths-service/scripts/commit-git-paths.mjs \
  --repository <repo> --path <file> [--path <file>...] --message <message>
```

Supply literal repository-relative file endpoints, both old and new for a
rename. Unrelated dirt neither grants ownership nor blocks closure — don't
fix it en passant, but don't let it block your own scoped commit either.

`--path` takes one file per flag, space-separated — never `--path=<file>`
(rejected as an unknown argument) and never a comma/newline-joined string
with quote characters spliced in by `sed`/string interpolation (the quotes
become literal bytes in the path and it reports "does not exist"). For many
files, build a real shell array and let the shell quote each element:

```sh
mapfile -t paths < <(git status --short | cut -c4-)
args=()
for p in "${paths[@]}"; do args+=(--path "$p"); done
node <script-path-above> --repository <repo> "${args[@]}" --message "<message>"
```

(an array, expanded quoted as `"${args[@]}"` — not a `$(...)`-interpolated
string, which re-splits on whitespace and drops any real quoting) or pass
each `--path <file>` pair out explicitly when the list is short.

## Before any destructive op

`git checkout`/`restore`/`reset`/`clean`, or `rm -rf` inside the repo: run
`git status` first. Stash (`-u` for untracked) or commit what's there before
proceeding. Never revert or discard a diff you didn't make.

## Bulk/blanket commits (`git add -A` + `git commit`)

Only when the owner explicitly asks for exactly that, in these words, in
this conversation — not as a shortcut when scoping feels slow. When asked:
check the dirty set for `.env`/secret-shaped files first (`git status
--short | grep -iE '\.env'` or similar), then add and commit with one commit
message that says plainly what this is (e.g. "bulk commit of accumulated
uncommitted work, owner-directed, no per-file review").

## History

`git log`, `git blame`, `git bisect` directly — read-only, no operator
needed. `git mv` preserves history through a tracked move; note in your
report when an untracked file moved by plain `mv` instead.
