#!/usr/bin/env node
// Reconcile a wave into its living owners. Retire redundant copies after owner integration.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { reconcile } from "./reconcile-copy-with-owner.mjs";

/** name -> directory (repository-relative) of every package in the mounted forest, outside legacy and evidence. */
export function forestPackages(repository, mount, allDirs = new Set()) {
  const found = new Map();
  const visit = (dir) => {
    const rel = relative(repository, dir);
    if (/\/(lib\/legacy|content\/text|vendor|history)(\/|$)/u.test(`/${rel}`)) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (entries.some((entry) => entry.isFile() && entry.name === "package.json")) {
      try {
        const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
        // A test fixture's manifest borrows a package's name; it is never where that package lives.
        if (typeof manifest.name === "string" && !found.has(manifest.name) && !/\/(test|fixtures)\//u.test(`/${rel}/`)) found.set(manifest.name, { dir: rel, manifest });
      } catch { /* an unreadable manifest names no package */ }
      allDirs.add(rel);
    }
    for (const entry of entries) if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") visit(join(dir, entry.name));
  };
  visit(join(repository, mount));
  return found;
}

/** The exclusion lines that leave exactly `admitted` (repository-relative directories) of the forest in the workspace. */
export function exclusions(mount, packageDirs, admitted) {
  const keep = new Set(admitted);
  const lines = [];
  const holdsKept = (dir) => [...keep].some((kept) => kept === dir || kept.startsWith(`${dir}/`));
  const visit = (dir) => {
    // A subtree glob does not name its own root for every reader (node's path.matchesGlob, which the lockfile
    // freshness check uses, does not), so a package at the root of an excluded subtree is also excluded by name.
    if (!holdsKept(dir)) { if (packageDirs.has(dir)) lines.push(`!${dir}`); lines.push(`!${dir}/**`); return; }
    if (packageDirs.has(dir) && !keep.has(dir)) lines.push(`!${dir}`);
    const children = [...new Set([...packageDirs].filter((other) => other.startsWith(`${dir}/`)).map((other) => other.slice(dir.length + 1).split("/")[0]))].sort();
    for (const child of children) visit(`${dir}/${child}`);
  };
  visit(mount);
  return lines;
}

export function retireWave({ census, wave: number, repository, mount, holds: extraHolds = {}, write = false, resolutions = {} }) {
  const holds = { ...(census.holds ?? {}), ...extraHolds };
  const wave = census.waves.find((entry) => entry.wave === number);
  if (!wave) throw new Error(`no wave ${number} in the census`);
  const forest = forestPackages(repository, mount);
  const packages = [];
  for (const name of wave.names) {
    const entry = census.packages[name], owner = forest.get(name);
    if (holds[name]) { packages.push({ name, held: holds[name] }); continue; }
    if (!owner) { packages.push({ name, missingOwner: entry?.owner ?? null }); continue; }
    const ownerDirectory = resolve(repository, owner.dir);
    const ownerRepository = execFileSync("git", ["-C", ownerDirectory, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
    const ownerPath = relative(ownerRepository, ownerDirectory);
    for (const copy of entry?.copies ?? []) {
      const report = reconcile({ copyRepository: repository, copyPath: copy.path, copyRevision: copy.revision ?? "HEAD", ownerRepository, ownerPath, apply: write, resolutions: resolutions[name] ?? {}, nestedCopy: Object.values(census.packages).flatMap((row) => row.copies ?? []).map((row) => row.path).filter((path) => path !== copy.path && path.startsWith(`${copy.path}/`)) });
      packages.push({ name, ...report });
    }
  }
  return { kind: "owner-retirement-wave/v2", wave: number, packages, moves: 0, applied: write };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const take = (flag) => { const at = args.indexOf(flag); return at < 0 ? undefined : args[at + 1]; };
  for (const flag of ["--census", "--wave", "--repo", "--mount"]) if (!take(flag)) throw new Error("usage: retire-wave --census <census.json> --wave <n> --repo <dir> --mount <path> [--resolutions <file>] [--hold <name>=<reason>]... [--write]");
  const holds = Object.fromEntries(args.flatMap((value, at) => args[at - 1] === "--hold" ? [[value.slice(0, value.indexOf("=")), value.slice(value.indexOf("=") + 1)]] : []));
  const result = retireWave({ census: JSON.parse(readFileSync(take("--census"), "utf8")), wave: Number(take("--wave")), repository: take("--repo"), mount: take("--mount"), write: args.includes("--write"), holds, resolutions: take("--resolutions") ? JSON.parse(readFileSync(take("--resolutions"), "utf8")) : {} });
  process.stdout.write(`${JSON.stringify(result, null, 1)}\n`);
}
