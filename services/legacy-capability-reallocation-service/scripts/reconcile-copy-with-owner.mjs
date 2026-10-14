#!/usr/bin/env node
// Three-way reconcile of a package copy into the repository that owns it, file by file, before the copy retires.
//
//   reconcile-copy-with-owner --copy-repo <dir> --copy <path> --owner-repo <dir> --owner <path>
//                             [--nested <path>]... [--apply] [--report <file>]
//
// Both sides are read at their checked-out HEAD. A file's history on each side is the set of blobs that path held in
// that repository's history. Containment proposes a merge; it does not receive a capability:
//   identical       the same blob on both sides
//   owner-newer     the copy's blob is one the owner already held: the owner moved on, keep the owner
//   copy-newer      the owner's blob is one the copy already held: the copy moved on, carry the copy
//   merged          both moved on from a blob they both held: git merge-file of owner, base and copy, cleanly
//   conflict        both moved on and the merge does not apply cleanly, or they share no blob: left for a person
//   resolved-owner  a file a person decided by keeping the owner's (named in `resolutions`, with the reason)
//   resolved-copy   a conflict a person decided by carrying the copy's file
//   copy-added      only the copy holds the file and the owner never did: carry it
//   copy-added      includes source previously deleted from the owner: integrate the selected source
//   owner-added     only the owner holds the file: keep it
// Files under a lib/legacy directory inside the package are left out on both sides: they are already legacy.
// Nothing is deleted from the owner. --apply writes copy-newer, merged and copy-added files into the owner's working
// tree; conflicts remain per file while other integrations proceed. Nested packages are reconciled separately.
import { execFileSync } from "node:child_process";
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// A package at a repository's root has the empty path: its pathspec is "." and its files carry no prefix.
const spec = (path) => path || ".";
const under = (path) => (path ? `${path}/` : "");
const git = (cwd, args, options = {}) => execFileSync("git", ["-C", cwd, ...args], { encoding: options.encoding ?? "utf8", maxBuffer: 1 << 30, ...options });

/** Relative path -> blob OID of every file under `path` at HEAD, leaving out nested package directories. */
function treeAt(repository, path, nested = [], revision = "HEAD") {
  const files = new Map();
  const modes = new Map();
  const entries = git(repository, ["ls-tree", "-rz", "--full-tree", revision, "--", spec(path)]).split("\0").map((line) => /^(\d+) (\w+) ([0-9a-f]+)\t([\s\S]+)$/u.exec(line)).filter((match) => match?.[2] === "blob");
  const boundaries = [...nested, ...entries.filter((entry) => entry[4].endsWith("/package.json") && entry[4] !== `${under(path)}package.json`).map((entry) => dirname(entry[4]))];
  for (const match of entries) {
    if (boundaries.some((inner) => match[4] === inner || match[4].startsWith(`${inner}/`))) continue;
    // A legacy subtree inside a package is already legacy: it stays where its restoration ledger names it.
    if (`/${match[4].slice(under(path).length)}`.includes("/lib/legacy/")) continue;
    files.set(match[4].slice(under(path).length), match[3]);
    modes.set(match[4].slice(under(path).length), match[1]);
  }
  return { files, modes };
}

export function filesAt(repository, path, nested = [], revision = "HEAD") { return treeAt(repository, path, nested, revision).files; }

/** Relative path -> the blobs that path held across the repository's history, newest first. */
const primedRoot = (repository, path, revision) => [...(primedHistories.get(`${repository}\0${revision}`) ?? new Map())].find(([root]) => !root || path === root || path.startsWith(`${root}/`));
const isPrimed = (repository, path, revision) => primedRoot(repository, path, revision) !== undefined;

export function historyAt(repository, path, revision = "HEAD") {
  revision = git(repository, ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`]).trim();
  const primed = primedRoot(repository, path, revision);
  const history = new Map();
  for (const [file, blobs] of primed ? primed[1] : pathHistory(repository, path, revision)) {
    if (file.startsWith(under(path))) history.set(file.slice(under(path).length), blobs);
  }
  return history;
}

/** Repository-relative path -> the blobs it held, newest first, for every file under `root`: one read of history. */
function pathHistory(repository, root, revision = "HEAD") {
  const history = new Map();
  const out = git(repository, ["log", "--format=", "--raw", "--no-abbrev", "--no-renames", revision, "--", spec(root)]);
  for (const line of out.split("\n")) {
    const match = /^:\d+ \d+ [0-9a-f]+ ([0-9a-f]+) \w+\t(.+)$/u.exec(line);
    if (!match || /^0+$/u.test(match[1]) || !match[2].startsWith(under(root))) continue;
    if (!history.has(match[2])) history.set(match[2], []);
    if (!history.get(match[2]).includes(match[1])) history.get(match[2]).push(match[1]);
  }
  return history;
}

const primedHistories = new Map();
/** Read the history under `root` once, so every package below it is answered from that one read. Reading a large
 *  repository's history once per package re-walked every commit for each. */
export function primeHistory(repository, root, revision = "HEAD") {
  revision = git(repository, ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`]).trim();
  const key = `${repository}\0${revision}`;
  if (!primedHistories.has(key)) primedHistories.set(key, new Map());
  if (!isPrimed(repository, root, revision)) primedHistories.get(key).set(root, pathHistory(repository, root, revision));
}

/** The blobs one file held across history, following it through renames, newest first. */
export function fileHistory(repository, path, revision = "HEAD") {
  const out = git(repository, ["log", "--follow", "--format=", "--raw", "--no-abbrev", revision, "--", path]);
  const blobs = [];
  for (const line of out.split("\n")) {
    const match = /^:\d+ \d+ [0-9a-f]+ ([0-9a-f]+) /u.exec(line);
    if (match && !/^0+$/u.test(match[1]) && !blobs.includes(match[1])) blobs.push(match[1]);
  }
  return blobs;
}

const blob = (repository, oid) => git(repository, ["cat-file", "blob", oid], { encoding: "buffer" });

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Three-way merge of one JSON value: a side that kept the base yields to the side that changed it; records merge
 *  key by key and lists keep the owner's entries with the copy's new ones after them. A value both sides changed
 *  differently returns undefined: a conflict for a person. */
export function mergeJson(base, owner, copy) {
  if (same(owner, copy) || same(copy, base)) return { value: owner };
  if (same(owner, base)) return { value: copy };
  if (isRecord(owner) && isRecord(copy)) {
    const value = {};
    for (const key of [...new Set([...Object.keys(owner), ...Object.keys(copy)])]) {
      const merged = mergeJson(isRecord(base) ? base[key] : undefined, owner[key], copy[key]);
      if (merged === undefined) return undefined;
      if (merged.value !== undefined) value[key] = merged.value;
    }
    return { value };
  }
  if (Array.isArray(owner) && Array.isArray(copy)) return { value: [...owner, ...copy.filter((entry) => !owner.some((held) => same(held, entry)))] };
  return settledSpecifier(owner, copy);
}

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/u;
/** Two specifiers of one dependency that differ only in how they name it: a workspace link is how the house links
 *  its own packages, so it settles a pinned version of the same package; of two plain versions the later stands. */
function settledSpecifier(owner, copy) {
  if (typeof owner !== "string" || typeof copy !== "string") return undefined;
  const linked = [owner, copy].filter((value) => value.startsWith("workspace:"));
  const pinned = [owner, copy].filter((value) => VERSION.test(value));
  if (linked.length === 1 && pinned.length === 1) return { value: linked[0] };
  if (pinned.length === 2) {
    const [left, right] = pinned.map((value) => VERSION.exec(value).slice(1).map(Number));
    const order = left.findIndex((part, at) => part !== right[at]);
    return { value: order < 0 || left[order] > right[order] ? owner : copy };
  }
  return undefined;
}

/** mergeJson over three JSON texts, written in the owner's indentation; undefined when any side is not JSON or the
 *  merge conflicts. */
export function mergeJsonText(base, owner, copy) {
  let parsed;
  // Sides that share no blob have no base: every value they hold differently is then merged two ways.
  try { parsed = [base, owner, copy].map((text) => (text === undefined ? undefined : JSON.parse(text))); } catch { return undefined; }
  const merged = mergeJson(...parsed);
  if (merged === undefined) return undefined;
  const indent = /^\{\n( +|\t)"/u.exec(owner)?.[1] ?? 2;
  return `${JSON.stringify(merged.value, null, indent)}\n`;
}

/** Reconcile one package; returns its report and, with apply, writes the owner's side. */
export function reconcile({ copyRepository, copyPath, copyRevision = "HEAD", ownerRepository, ownerPath, nestedCopy = [], nestedOwner = [], apply = false, resolutions = {} }) {
  const heads = [copyRepository, ownerRepository].map((repository) => git(repository, ["rev-parse", "HEAD"]).trim());
  const copyCommit = git(copyRepository, ["rev-parse", "--verify", "--end-of-options", `${copyRevision}^{commit}`]).trim();
  const copyTree = treeAt(copyRepository, copyPath, nestedCopy, copyCommit), ownerTree = treeAt(ownerRepository, ownerPath, nestedOwner, heads[1]);
  const copy = copyTree.files, owner = ownerTree.files;
  primeHistory(copyRepository, copyPath, copyCommit);
  const copyHistory = historyAt(copyRepository, copyPath, copyCommit);
  const ownerHistory = historyAt(ownerRepository, ownerPath, heads[1]);
  const files = [];
  const pending = [];
  let written = 0;
  const scratch = mkdtempSync(join(tmpdir(), "reconcile-"));
  try {
    for (const relative of [...new Set([...copy.keys(), ...owner.keys()])].sort()) {
      const c = copy.get(relative), o = owner.get(relative);
      // Each side's history of the path, read once for the whole package, decides most files. Only a file neither
      // history decides is followed through renames, since owners were split from moved paths; walking every
      // differing file that way read the whole history of a large repository once per file.
      const ownerPathBlobs = ownerHistory.get(relative) ?? [], copyPathBlobs = copyHistory.get(relative) ?? [];
      let outcome, base = null;
      if (c && o && c === o && copyTree.modes.get(relative) === ownerTree.modes.get(relative)) outcome = "identical";
      else if (c && o && c === o) outcome = "copy-newer";
      else if (c && !o) outcome = "copy-added";
      else if (!c && o) outcome = "owner-added";
      else if (ownerPathBlobs.includes(c)) outcome = "owner-newer";
      else if (copyPathBlobs.includes(o)) outcome = "copy-newer";
      else {
        // A copy whose history was primed sits in a large repository: following one file through renames there runs
        // rename detection over every commit's whole tree, so its path history stands in. Missing a rename can only
        // miss a shared blob, which leaves the file a conflict for a person rather than deciding it wrongly.
        const ownerBlobs = fileHistory(ownerRepository, `${under(ownerPath)}${relative}`, heads[1]);
        const copyBlobs = copyPathBlobs;
        const copyHeld = new Set(copyBlobs);
        if (ownerBlobs.includes(c)) outcome = "owner-newer";
        else if (copyHeld.has(o)) outcome = "copy-newer";
        else {
          base = ownerBlobs.find((oid) => copyHeld.has(oid)) ?? null;
          outcome = base ? "merge" : "conflict";
        }
      }
      const target = join(ownerRepository, ownerPath, relative);
      // Compare and integrate the named Git source, never unrelated working-tree bytes.
      const copyBytes = () => blob(copyRepository, c);
      let selectedBytes;
      if (outcome === "merge") {
        const [ours, theirs, ancestor] = ["owner", "copy", "base"].map((name) => join(scratch, name));
        writeFileSync(ours, blob(ownerRepository, o));
        writeFileSync(theirs, copyBytes());
        writeFileSync(ancestor, blob(ownerRepository, base));
        let clean = true, merged;
        try { execFileSync("git", ["merge-file", "-q", ours, ancestor, theirs]); merged = readFileSync(ours); } catch { clean = false; }
        // A JSON record whose lines clash may still merge by its structure: a manifest's specifiers changed on one
        // side and its exports added on the other touch neighbouring lines, never the same value.
        if (!clean && relative.endsWith(".json")) {
          const structural = mergeJsonText(blob(ownerRepository, base).toString("utf8"), blob(ownerRepository, o).toString("utf8"), copyBytes().toString("utf8"));
          if (structural !== undefined) { clean = true; merged = Buffer.from(structural); }
        }
        outcome = clean ? "merged" : "conflict";
        if (clean) selectedBytes = merged;
      } else if (outcome === "conflict" && relative.endsWith(".json")) {
        const structural = mergeJsonText(undefined, blob(ownerRepository, o).toString("utf8"), copyBytes().toString("utf8"));
        if (structural !== undefined) {
          outcome = "merged";
          selectedBytes = Buffer.from(structural);
        }
      } else if (outcome === "copy-newer" || outcome === "copy-added") {
        selectedBytes = copyBytes();
      }
      // A person may decide any file the reconcile would write or leave: a conflict, or a copy-newer, merged or
      // copy-added file whose carrying would not fit the owner (an owner test it contradicts, a path only the copy's
      // repository resolves). The decision and its reason are recorded; the owner is never written against it.
      const resolution = resolutions[relative];
      if (resolution && resolution.keep !== "owner" && resolution.keep !== "copy") throw new TypeError(`resolution of ${relative} must keep "owner" or "copy"`);
      if (resolution) {
        if (resolution.keep === "copy" && !c) throw new TypeError(`resolution of ${relative} names an absent copy`);
        outcome = `resolved-${resolution.keep}`;
        selectedBytes = resolution.keep === "copy" ? copyBytes() : undefined;
      }
      if (selectedBytes !== undefined) pending.push({ relative, target, bytes: selectedBytes, fromCopy: ["copy-added", "copy-newer", "resolved-copy"].includes(outcome) });
      files.push({ path: relative, outcome, copy: c ?? null, owner: o ?? null, ...(base ? { base } : {}), ...(resolution ? { because: resolution.because } : {}) });
    }
    // Integrate the resolved files. A conflict in one file does not stop other work.
    if (apply) {
      for (const write of pending) {
        const mode = (write.fromCopy ? copyTree : ownerTree).modes.get(write.relative);
        let current;
        try { current = lstatSync(write.target); } catch (error) { if (error.code !== "ENOENT") throw error; }
        if (current) {
          const held = current.isSymbolicLink() ? Buffer.from(readlinkSync(write.target)) : readFileSync(write.target);
          const prior = owner.get(write.relative) ? blob(ownerRepository, owner.get(write.relative)) : Buffer.alloc(0);
          if (!held.equals(prior) && !held.equals(write.bytes)) {
            const paths = ["current", "prior", "incoming"].map((name) => join(scratch, name));
            for (const [at, bytes] of [held, prior, write.bytes].entries()) writeFileSync(paths[at], bytes);
            let merged;
            if (!current.isSymbolicLink() && mode !== "120000") {
              try { execFileSync("git", ["merge-file", "-q", paths[0], paths[1], paths[2]]); merged = readFileSync(paths[0]); } catch { /* Keep this file's live edits; other files continue. */ }
              if (merged === undefined && write.relative.endsWith(".json")) {
                const structural = mergeJsonText(prior.toString("utf8"), held.toString("utf8"), write.bytes.toString("utf8"));
                if (structural !== undefined) merged = Buffer.from(structural);
              }
            }
            if (merged === undefined) { files.find((file) => file.path === write.relative).outcome = "worktree-conflict"; continue; }
            write.bytes = merged;
          }
        }
        mkdirSync(dirname(write.target), { recursive: true });
        if (current) unlinkSync(write.target);
        if (mode === "120000") symlinkSync(write.bytes.toString("utf8"), write.target);
        else { writeFileSync(write.target, write.bytes); chmodSync(write.target, mode === "100755" ? 0o755 : 0o644); }
        written += 1;
      }
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  const counts = {};
  for (const file of files) counts[file.outcome] = (counts[file.outcome] ?? 0) + 1;
  return {
    kind: "copy-owner-reconcile-report/v1",
    copy: { repository: copyRepository, path: copyPath, commit: copyCommit },
    owner: { repository: ownerRepository, path: ownerPath, commit: heads[1] },
    applied: apply,
    written,
    counts,
    files,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const take = (flag) => { const at = args.indexOf(flag); return at < 0 ? undefined : args[at + 1]; };
  const all = (flag) => args.flatMap((value, at) => (args[at - 1] === flag ? [value] : []));
  const required = ["--copy-repo", "--copy", "--owner-repo", "--owner"];
  // A package at a repository's root is named by the empty path, so only an absent flag is missing.
  if (required.some((flag) => take(flag) === undefined)) {
    process.stderr.write("usage: reconcile-copy-with-owner --copy-repo <dir> --copy <path> --owner-repo <dir> --owner <path> [--nested-copy <path>]... [--nested-owner <path>]... [--resolutions <file>] [--apply] [--report <file>]\n");
    process.exit(2);
  }
  // Read the copy's history once, as a wave does: a copy in a large repository is then never followed file by file.
  const report = reconcile({
    copyRepository: take("--copy-repo"), copyPath: take("--copy"), ownerRepository: take("--owner-repo"), ownerPath: take("--owner"),
    copyRevision: take("--copy-revision") ?? "HEAD",
    nestedCopy: all("--nested-copy"), nestedOwner: all("--nested-owner"), apply: args.includes("--apply"),
    resolutions: take("--resolutions") ? JSON.parse(readFileSync(take("--resolutions"), "utf8")) : {},
  });
  const text = `${JSON.stringify(report, null, 1)}\n`;
  if (take("--report")) writeFileSync(take("--report"), text);
  else process.stdout.write(text);
  process.stderr.write(`${report.copy.path} -> ${report.owner.path}: ${JSON.stringify(report.counts)}\n`);
}
