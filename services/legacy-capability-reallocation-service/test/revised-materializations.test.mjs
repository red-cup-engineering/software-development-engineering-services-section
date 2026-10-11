import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { verifyLegacyCapabilityReallocation } from "../src/legacy-capability-reallocation.mjs";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, "-c", "user.name=test", "-c", "user.email=test@example.invalid", ...args], { encoding: "utf8" });

// A purged archive whose notes were materialized into science: one left as it was, one thickened in place
// after materialization, one edited as it was carried out of the archive, and one whose bytes neither the
// archive's history nor the carrier's ever held.
function estate() {
  const repository = mkdtempSync(join(tmpdir(), "revised-materializations-"));
  git(repository, "init", "-q");
  const notes = join(repository, "science", "notes");
  mkdirSync(notes, { recursive: true });
  const archived = { kept: "kept note\n", thickened: "thin note\n", rewritten: "original note\n", carried: "carried note\n" };
  const archive = join(repository, "lib", "legacy", "purged", "notes");
  mkdirSync(archive, { recursive: true });
  writeFileSync(join(archive, "carried.md"), archived.carried);
  git(repository, "add", "-A"); git(repository, "commit", "-q", "-m", "archive");
  git(repository, "rm", "-q", "-r", "lib"); writeFileSync(join(notes, "carried.md"), "carried note, edited as it was carried\n");
  writeFileSync(join(notes, "kept.md"), archived.kept);
  writeFileSync(join(notes, "thickened.md"), archived.thickened);
  writeFileSync(join(notes, "rewritten.md"), "rewritten before it was ever committed\n");
  git(repository, "add", "-A"); git(repository, "commit", "-q", "-m", "materialize");
  writeFileSync(join(notes, "thickened.md"), "thin note, thickened in place\n");
  git(repository, "commit", "-q", "-am", "thicken");
  const record = (name) => ({ id: `legacy-source:${name}`, source: { path: `notes/${name}.md`, sha256: sha256(archived[name]), bytes: archived[name].length, extension: ".md", kind: "text-carrier" } });
  const capability = (name) => ({
    id: `note-${name}`, sourcePaths: [`notes/${name}.md`], effect: `keeps the ${name} note`, carrier: "markdown-document",
    allocation: { state: "retired", destination: "science/notes", rationale: "materialized into science",
      modernEvidence: [{ path: `science/notes/${name}.md`, effect: `the ${name} note, carried on in science` }],
      materializations: [{ sourcePath: `notes/${name}.md`, destinationPath: `science/notes/${name}.md` }] },
  });
  const ledger = (names) => {
    const path = join(repository, `ledger-${names.join("-")}.json`);
    writeFileSync(path, JSON.stringify({ kind: "legacy-capability-reallocation-ledger/v3", repositoryRoot: repository, legacyRoot: "lib/legacy/purged",
      inventory: {}, records: names.map(record), capabilities: names.map(capability), archiveDisposition: "purged" }));
    return path;
  };
  return { repository, ledger };
}

test("a carrier thickened after a provable materialization reads revised, at the blob it was materialized at", () => {
  const { repository, ledger } = estate();
  const verified = verifyLegacyCapabilityReallocation({ ledgerPath: ledger(["kept", "thickened"]), repositoryRoot: repository });
  assert.deepEqual(verified.failures, []);
  assert.equal(verified.status, "fully-reallocated");
  const materializedAt = git(repository, "rev-parse", "HEAD~1:science/notes/thickened.md").trim();
  assert.deepEqual(verified.materializations, [
    { capability: "note-kept", destinationPath: "science/notes/kept.md", reading: "identical" },
    { capability: "note-thickened", destinationPath: "science/notes/thickened.md", reading: "revised", materializedAt },
  ]);
});

test("a carrier whose bytes neither the archive nor its own path ever held is still a failure", () => {
  const { repository, ledger } = estate();
  const verified = verifyLegacyCapabilityReallocation({ ledgerPath: ledger(["rewritten"]), repositoryRoot: repository });
  assert.equal(verified.status, "incomplete");
  assert.match(verified.failures[0], /neither its path nor the archive's source path ever held it before the carrier: science\/notes\/rewritten\.md$/u);
  assert.deepEqual(verified.materializations, []);
});

test("a carrier edited as it was carried reads revised in transit, after the archive held its bytes", () => {
  const { repository, ledger } = estate();
  const verified = verifyLegacyCapabilityReallocation({ ledgerPath: ledger(["carried"]), repositoryRoot: repository });
  assert.deepEqual(verified.failures, []);
  assert.equal(verified.status, "fully-reallocated");
  const archivedAt = git(repository, "rev-parse", "HEAD~2").trim();
  const materializedIn = git(repository, "rev-parse", "HEAD~1").trim();
  assert.deepEqual(verified.materializations, [{
    capability: "note-carried", destinationPath: "science/notes/carried.md", reading: "revised", inTransit: true,
    archivedAt, materializedIn, materializedAt: git(repository, "rev-parse", "HEAD~1:science/notes/carried.md").trim(),
  }]);
});
