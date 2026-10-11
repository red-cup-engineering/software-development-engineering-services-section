#!/usr/bin/env node
// Reconcile every package of one migration wave into its owner and write one report per package.
//
//   reconcile-wave --census <census.json> --wave <n> --copy-repo <dir>
//                  --owner-root <owner/repository=dir>... --reports <dir> [--resolutions <file>] [--apply]
//
// The census is census-owned-copies' output: its waves name each wave's packages, its packages each package's owner
// (repository and path) and copy paths. A package whose copy still has open pull requests against it is held:
// it is reported as held and not reconciled. --resolutions names a person's decision on each conflict:
// {"<package>": {"<file>": {"keep": "owner" | "copy", "because": "<why>"}}}.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { primeHistory, reconcile } from "./reconcile-copy-with-owner.mjs";

const args = process.argv.slice(2);
const take = (flag) => { const at = args.indexOf(flag); return at < 0 ? undefined : args[at + 1]; };
const all = (flag) => args.flatMap((value, at) => (args[at - 1] === flag ? [value] : []));
const census = JSON.parse(readFileSync(take("--census"), "utf8"));
const wave = (census.waves ?? []).find((entry) => entry.wave === Number(take("--wave")));
if (!wave) throw new Error(`no wave ${take("--wave")} in the census`);
const copyRepository = take("--copy-repo");
const owners = new Map(all("--owner-root").map((pair) => pair.split("=")));
const reports = take("--reports");
const resolutions = take("--resolutions") ? JSON.parse(readFileSync(take("--resolutions"), "utf8")) : {};
mkdirSync(reports, { recursive: true });

/** Package directories strictly inside `path` at HEAD: reconciled as their own packages, never as files of this one. */
const nestedPackages = (repository, path) => execFileSync("git", ["-C", repository, "ls-tree", "-r", "--name-only", "--full-tree", "HEAD", "--", path || "."], { encoding: "utf8", maxBuffer: 1 << 30 })
  .split("\n").filter((file) => file.endsWith("/package.json") && file !== (path ? `${path}/package.json` : "package.json") && !file.includes("/node_modules/"))
  .map((file) => file.slice(0, -"/package.json".length));

/** The deepest directory holding every path: one history read under it answers every package of the wave. */
function commonRoot(paths) {
  const [first = [], ...rest] = paths.map((path) => path.split("/"));
  let length = first.length;
  for (const parts of rest) {
    let at = 0;
    while (at < length && parts[at] === first[at]) at += 1;
    length = at;
  }
  return first.slice(0, length).join("/");
}
const entries = wave.names.map((name) => census.packages[name]).filter(Boolean);
primeHistory(copyRepository, commonRoot(entries.flatMap((entry) => entry.copies.map((copy) => copy.path))));
for (const [repository, root] of owners) {
  const paths = entries.filter((entry) => entry.owner.repository === repository).map((entry) => entry.owner.path);
  if (paths.length) primeHistory(root, paths.some((path) => !path) ? "" : commonRoot(paths));
}

const summary = { kind: "copy-owner-reconcile-wave/v1", wave: wave.wave, packages: [] };
for (const name of wave.names) {
  const entry = census.packages[name];
  const held = census.openPullRequests?.[name];
  if (held?.length) { summary.packages.push({ name, held }); continue; }
  const ownerRepository = owners.get(entry.owner.repository);
  if (!ownerRepository) { summary.packages.push({ name, unreadOwner: entry.owner.repository }); continue; }
  for (const copy of entry.copies) {
    const report = reconcile({
      copyRepository, copyPath: copy.path, ownerRepository, ownerPath: entry.owner.path,
      nestedCopy: nestedPackages(copyRepository, copy.path), nestedOwner: nestedPackages(ownerRepository, entry.owner.path),
      apply: args.includes("--apply"), resolutions: resolutions[name] ?? {},
    });
    const file = join(reports, `${name.replace(/^@/u, "").replace(/\//gu, "__")}.json`);
    writeFileSync(file, `${JSON.stringify({ name, ...report }, null, 1)}\n`);
    summary.packages.push({ name, copy: copy.path, owner: `${entry.owner.repository}:${entry.owner.path}`, counts: report.counts });
  }
}
writeFileSync(join(reports, "wave.json"), `${JSON.stringify(summary, null, 1)}\n`);
const totals = {};
for (const row of summary.packages) for (const [outcome, n] of Object.entries(row.counts ?? {})) totals[outcome] = (totals[outcome] ?? 0) + n;
process.stdout.write(`${JSON.stringify({ wave: wave.wave, packages: wave.names.length, held: summary.packages.filter((row) => row.held).length, totals })}\n`);
