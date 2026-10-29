---
title: "Skillful version control conduct"
date-created: 2026-09-06
authors: [emsenn, claude-sonnet-5]
status: draft
part-of: version-control-services-section
version: 0.1.0
stability: draft
---

# Skillful version control conduct

## What this is

This states how a session uses version control in this repository. It replaces a prior blanket rule in [working-discipline.md](.claude/rules/working-discipline.md) — "the main session does not run git mutations itself" — that the founder ruled overgeneralized: "'Use version control skillfully' would be a better statement of the rule, but 'Act skillfully' is the actual rule and 'use version control' is just a class of act" ([founder utterance, 2026-09-06](lib/emsenn/services/561-group/services/561-group-services-section/data/records/2026-09-06-founder-utterances-on-skillful-version-control.jsonl)). The prior rule generalized from one real incident — a session's hand-run recovery/branch/commit surgery on an already-damaged shared checkout, 2026-09-02 — into a ban covering every git mutation regardless of risk. The founder named the concrete harm this caused: "the specific pain point is that the 'rule' as written is leading you and other agents to leave your own work uncommitted, and that's rather the opposite of having it so that you and other agents skillfully use git" ([founder utterance, 2026-09-06](lib/emsenn/services/561-group/services/561-group-services-section/data/records/2026-09-06-founder-utterances-on-skillful-version-control.jsonl)). This document states the risk-calibrated version instead.

## The general principle

Version control conduct is not a standalone rule; it is one class of act the same general standard already governs. **A session's version-control conduct MUST** be evaluated against the same standard as any other act — matched to its actual reversibility and blast radius — never a blanket category ban substituted for that judgment ([founder utterance, 2026-09-06](../../../../../../../../../../../../../../561-group-services-section/data/records/2026-09-06-founder-utterances-on-skillful-version-control.jsonl)). Git is available and NOT banned; a false 'git ban' circulated from an agent-authored note and was refuted directly by the owner (**owner (emsenn) 2026-08-30**, [.claude/rules/working-discipline.md](../../../../../../../../../../../../../../../../../../../.claude/rules/working-discipline.md); applies to: any session considering whether git is available to it at all).

## Read-only operations

Reading history and state carries no risk of *loss*. **A session MAY** run `git status`, `git log`, `git diff`, `git blame`, and `git bisect` at any time, from any context, without elevated care for that risk (this specification's own conduct rule; supersedes the read-only carve-out in working-discipline.md). That does not make an unscoped one free: this repository is 270k+ tracked files and several GB of `.git`, worked by many concurrent sessions and subagents sharing one disk, and `git grep`, `git status`, and `git log -p`/`--all` each walk the whole working tree or whole history when run without a pathspec — the documented mechanism behind repeated 2026-09-10 WSL crashes ([working-discipline.md, "'Use git normally' does not mean unscoped"](../../../../../../../../../../../../../../../../../../../.claude/rules/working-discipline.md)). **A session MUST** scope every such command to a path and use `rg`/`fd` rather than `git grep` for text search; that I/O discipline, not blast-radius risk, is why an unscoped read-only command still warrants care here.

## Committing your own bounded work

A session that finishes real, well-scoped, reviewed work and leaves it sitting uncommitted has not acted skillfully — that state is itself a risk: it is invisible to other sessions, absent from the repo's own history, and exposed to being silently swept up or lost by a concurrent actor's mutation of the same tree (observed directly: a concurrent session's tree-wide directory rename moved this session's own uncommitted files mid-turn, and only their accidental inclusion in that rename prevented loss). **A session MUST** commit its own completed, reviewed, well-scoped changes rather than leaving them uncommitted, once that work is done ([founder utterance, 2026-09-06](../../../../../../../../../../../../../../561-group-services-section/data/records/2026-09-06-founder-utterances-on-skillful-version-control.jsonl); [working-discipline.md, "Git is available and NOT banned"](../../../../../../../../../../../../../../../../../../../.claude/rules/working-discipline.md)). **A session staging its own work MUST** stage exactly the paths it authored or reviewed this turn, never a blanket `git add -A` or `git add .` in a shared checkout that may hold other uncommitted, unrelated work ([working-discipline.md, "a session should investigate before deleting or overwriting"](../../../../../../../../../../../../../../../../../../../.claude/rules/working-discipline.md)).

## Higher-risk operations

Some git operations are hard or impossible to reverse, or affect state other sessions depend on: `git reset --hard`, `git push --force`, history rewrite, branch deletion, a `checkout` that discards uncommitted work, and resolving a merge conflict by discarding a concurrent change. **A session about to run a higher-risk git operation MUST** re-run `git status` and `git log` immediately beforehand rather than trusting an earlier check, since disk state in a shared checkout can change between the check and the act ([working-discipline.md, "run git status before any command that could discard uncommitted work"](../../../../../../../../../../../../../../../../../../../.claude/rules/working-discipline.md)). The 2026-09-02 incident that produced the original blanket rule was exactly this class — hand-run recovery surgery on an already-damaged shared checkout — not an ordinary commit of a session's own work. **A session facing recovery or surgery on an already-damaged or conflicted shared checkout SHOULD** dispatch that work to the version-control capability rather than freehand it, mirroring the actual 2026-09-02 incident this document supersedes the overgeneralized reaction to ([git-services-section README](../../../../../services/git-services-section/README.md)).

## Pushing to a shared remote

Pushing affects `origin`, a surface other people and processes read. It is a distinct act from committing, not an automatic continuation of it — this repo's own history routinely carries dozens of local commits ahead of `origin/main` before a push. **A session MAY** push its own already-committed, scoped work to `origin` when doing so serves the work at hand; a local commit is not itself a request to push, and a large number of local commits ahead of `origin/main` is normal, not a defect to fix reflexively (this specification's own conduct rule; the repository's own history evidences dozens of unpushed local commits as ordinary practice).

## Open questions

- **Whether any git operation in this repository should be mechanically enforced (a hook refusing a force-push or hard reset without an explicit override), rather than left to a session's judgment under this specification alone.** Resolution blocked by: a founder ruling on whether this policy graduates from a stated specification to a machine-enforced content/policies/*.json guard, in the shape already established by computer-code-development-services-section's rsi-mape-k.json
