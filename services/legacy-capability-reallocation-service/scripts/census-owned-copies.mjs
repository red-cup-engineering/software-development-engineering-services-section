#!/usr/bin/env node
// Census of the package copies this repository holds of packages an owning forest defines (DRC-2, one owner).
//
//   census-owned-copies --owner-forest <dir> --copy-repo <dir> --write <census.json>
//                       [--open-pr-files <file>] [--wave-size <n> | --cuts 0-0,1-3,...]
//
// Every package named both in the owning forest (outside lib/legacy) and in the copy repository (outside lib/legacy,
// its submodule mounts and the workspace's evidence directories) is reported with its owner (repository and path),
// each copy path, whether the copy is byte-identical, and the copy's dependency edges to other copied packages.
// Its wave is its dependency level, leaves first. --open-pr-files reads lines "<pull request> <path>" (a pull
// request's changed files) and marks every copy those files touch as held. Waves are whole dependency levels taken
// in order until a wave holds at least --wave-size packages (default 30), or the explicit level ranges of --cuts.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP = new Set(["node_modules", ".git", "dist", "fixtures"]);
const EVIDENCE = ["/lib/legacy", "/content/text/", "/vendor/", "/history/"];
const git = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", maxBuffer: 1 << 30 });

function submodulePaths(root) {
  if (!existsSync(join(root, ".gitmodules"))) return new Set();
  let out = "";
  try { out = git(root, ["config", "-f", ".gitmodules", "--get-regexp", "^submodule\\..*\\.path$"]); } catch { return new Set(); }
  return new Set(out.split("\n").filter(Boolean).map((line) => join(root, line.slice(line.indexOf(" ") + 1))));
}

/** name -> [{dir, manifest}] of every named package below root, outside evidence and (optionally) submodules. */
export function packagesBelow(root, { stopAtSubmodules }) {
  const stops = stopAtSubmodules ? submodulePaths(root) : new Set();
  const found = new Map();
  const visit = (dir) => {
    const rel = `/${relative(root, dir)}/`;
    if (EVIDENCE.some((marker) => rel.includes(marker))) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (entries.some((entry) => entry.isFile() && entry.name === "package.json")) {
      try {
        const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
        if (typeof manifest.name === "string" && manifest.name.startsWith("@")) {
          if (!found.has(manifest.name)) found.set(manifest.name, []);
          found.get(manifest.name).push({ dir, manifest });
        }
      } catch { /* an unreadable manifest names no package */ }
    }
    for (const entry of entries) {
      const child = join(dir, entry.name);
      if (entry.isDirectory() && !SKIP.has(entry.name) && !stops.has(child)) visit(child);
    }
  };
  visit(root);
  return found;
}

/** Relative path -> sha256 of a package's own files, not descending into the nested package directories given. */
function filesOf(dir, nested) {
  const files = new Map();
  const visit = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const child = join(at, entry.name);
      // A lib/legacy subtree inside a package is already legacy and stays where it is; it is not the package's to carry.
      const innerLegacy = entry.name === "legacy" && at.endsWith("/lib");
      // A directory holding its own .git is a mounted repository, owned on its own.
      const mounted = entry.isDirectory() && existsSync(join(child, ".git"));
      if (entry.isDirectory()) { if (entry.name !== "node_modules" && entry.name !== ".git" && !innerLegacy && !mounted && !nested.has(child)) visit(child); continue; }
      if (!entry.isFile() || lstatSync(child).isSymbolicLink()) continue;
      files.set(relative(dir, child), createHash("sha256").update(readFileSync(child)).digest("hex"));
    }
  };
  visit(dir);
  return files;
}

function repositoryOf(dir) {
  const top = git(dir, ["rev-parse", "--show-toplevel"]).trim();
  const url = git(top, ["config", "--get", "remote.origin.url"]).trim();
  return { top, name: url.replace(/\.git$/u, "").split("github.com").at(-1).replace(/^[:/]+/u, "") };
}

/** Whole levels, in order, grouped until each group holds at least `size` packages. */
export function cutWaves(levels, size) {
  const counts = new Map();
  for (const level of levels) counts.set(level, (counts.get(level) ?? 0) + 1);
  const ordered = [...counts.keys()].sort((a, b) => a - b);
  const cuts = [];
  let from = null, held = 0;
  for (const level of ordered) {
    if (from === null) from = level;
    held += counts.get(level);
    if (held >= size) { cuts.push([from, level]); from = null; held = 0; }
  }
  if (from !== null) cuts.push([from, ordered.at(-1)]);
  return cuts;
}

export function census({ ownerForest, copyRepository, openPullRequestFiles = [], cuts = null, waveSize = 30 }) {
  const owner = packagesBelow(ownerForest, { stopAtSubmodules: false });
  const copies = packagesBelow(copyRepository, { stopAtSubmodules: true });
  const ownerDirs = new Set([...owner.values()].flat().map(({ dir }) => dir));
  const copyDirs = new Set([...copies.values()].flat().map(({ dir }) => dir));
  const shared = [...owner.keys()].filter((name) => copies.has(name)).sort();
  const sharedSet = new Set(shared);
  const packages = {};
  for (const name of shared) {
    const { dir: ownerDir, manifest: ownerManifest } = owner.get(name)[0];
    const { top, name: repository } = repositoryOf(ownerDir);
    const ownerFiles = filesOf(ownerDir, new Set([...ownerDirs].filter((dir) => dir !== ownerDir)));
    const deps = new Set();
    const copyRows = copies.get(name).map(({ dir, manifest }) => {
      const copyFiles = filesOf(dir, new Set([...copyDirs].filter((other) => other !== dir)));
      const copyOnly = [...copyFiles.keys()].filter((file) => !ownerFiles.has(file)).sort();
      const ownerOnly = [...ownerFiles.keys()].filter((file) => !copyFiles.has(file)).sort();
      const differ = [...copyFiles.keys()].filter((file) => ownerFiles.has(file) && ownerFiles.get(file) !== copyFiles.get(file)).sort();
      for (const dep of Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })) if (sharedSet.has(dep) && dep !== name) deps.add(dep);
      return { path: relative(copyRepository, dir), version: manifest.version ?? null, identical: !copyOnly.length && !ownerOnly.length && !differ.length, copyOnly, ownerOnly, differ };
    });
    packages[name] = {
      name,
      owner: { repository, path: relative(top, ownerDir), version: ownerManifest.version ?? null, occurrences: owner.get(name).length },
      copies: copyRows,
      deps: [...deps].sort(),
      consumers: [],
    };
  }
  for (const [name, entries] of copies) for (const { manifest } of entries) {
    for (const dep of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
      if (packages[dep] && dep !== name && !packages[dep].consumers.includes(name)) packages[dep].consumers.push(name);
    }
  }
  const level = new Map();
  const depth = (name, stack = new Set()) => {
    if (level.has(name)) return level.get(name);
    if (stack.has(name)) return 0;
    stack.add(name);
    const d = Math.max(0, ...packages[name].deps.map((dep) => depth(dep, stack) + 1));
    stack.delete(name);
    level.set(name, d);
    return d;
  };
  for (const name of shared) { packages[name].level = depth(name); packages[name].consumers.sort(); }
  const openPullRequests = {};
  for (const { pullRequest, path } of openPullRequestFiles) {
    for (const name of shared) {
      if (packages[name].copies.some((copy) => path.startsWith(`${copy.path}/`))) {
        if (!openPullRequests[name]) openPullRequests[name] = [];
        if (!openPullRequests[name].includes(pullRequest)) openPullRequests[name].push(pullRequest);
      }
    }
  }
  const result = {
    kind: "owned-copy-census/v1",
    ownerForest: { commit: git(ownerForest, ["rev-parse", "HEAD"]).trim() },
    copyRepository: { commit: git(copyRepository, ["rev-parse", "HEAD"]).trim() },
    ownerPackages: owner.size, copyPackages: copies.size, shared: shared.length,
    packages, openPullRequests,
  };
  {
    if (!cuts) cuts = cutWaves(shared.map((name) => packages[name].level), waveSize);
    result.waves = cuts.map(([from, to], index) => {
      const names = shared.filter((name) => packages[name].level >= from && packages[name].level <= to);
      return {
        wave: index + 1, levels: [from, to], packages: names.length,
        identical: names.filter((name) => packages[name].copies.every((copy) => copy.identical)).length,
        reconcileFiles: names.reduce((sum, name) => sum + packages[name].copies[0].differ.length + packages[name].copies[0].copyOnly.length, 0),
        held: Object.fromEntries(names.filter((name) => openPullRequests[name]).map((name) => [name, openPullRequests[name].sort((a, b) => a - b)])),
        names,
      };
    });
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const take = (flag) => { const at = args.indexOf(flag); return at < 0 ? undefined : args[at + 1]; };
  if (!take("--owner-forest") || !take("--copy-repo") || !take("--write")) {
    process.stderr.write("usage: census-owned-copies --owner-forest <dir> --copy-repo <dir> --write <census.json> [--open-pr-files <file>] [--wave-size <n> | --cuts a-b,c-d,...]\n");
    process.exit(2);
  }
  const openPullRequestFiles = take("--open-pr-files")
    ? readFileSync(take("--open-pr-files"), "utf8").split("\n").filter(Boolean).map((line) => ({ pullRequest: Number(line.slice(0, line.indexOf(" "))), path: line.slice(line.indexOf(" ") + 1) }))
    : [];
  const cuts = take("--cuts") ? take("--cuts").split(",").map((range) => range.split("-").map(Number)) : null;
  const result = census({ ownerForest: take("--owner-forest"), copyRepository: take("--copy-repo"), openPullRequestFiles, cuts, waveSize: Number(take("--wave-size") ?? 30) });
  writeFileSync(take("--write"), `${JSON.stringify(result, null, 1)}\n`);
  process.stdout.write(`${JSON.stringify({ ownerPackages: result.ownerPackages, copyPackages: result.copyPackages, shared: result.shared, waves: result.waves?.map(({ wave, packages, identical, reconcileFiles, held }) => ({ wave, packages, identical, reconcileFiles, held: Object.keys(held).length })) })}\n`);
}
