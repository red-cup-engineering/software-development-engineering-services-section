import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { mergeJsonText, reconcile } from "../scripts/reconcile-copy-with-owner.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8" });
function repository(root) {
  mkdirSync(root, { recursive: true });
  git(root, "init", "-q");
  return (files, message) => {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", message);
  };
}
const lines = (...values) => `${values.join("\n")}\n`;

test("each file of a copy is carried, kept or left for a person by which side moved on from what both held", () => {
  const root = mkdtempSync(join(tmpdir(), "reconcile-test-"));
  try {
    const copy = join(root, "copy"), owner = join(root, "owner");
    const commitCopy = repository(copy), commitOwner = repository(owner);
    const base = {
      "pkg/same.mjs": "same\n",
      "pkg/copy-moved.mjs": "v1\n",
      "pkg/owner-moved.mjs": "v1\n",
      "pkg/both-moved.mjs": lines("one", "two", "three", "four", "five"),
      "pkg/clash.mjs": "base\n",
    };
    // The owner was split from the copy's repository at its first commit, under another path.
    commitCopy(Object.fromEntries(Object.entries(base).map(([path, text]) => [`old/${path}`, text])), "first");
    git(copy, "mv", "old/pkg", "pkg");
    git(copy, "commit", "-q", "-m", "move");
    commitOwner(Object.fromEntries(Object.entries(base).map(([path, text]) => [path.replace("pkg/", "svc/"), text])), "split");
    commitCopy({
      "pkg/copy-moved.mjs": "v2\n",
      "pkg/both-moved.mjs": lines("one", "two", "three", "four", "FIVE"),
      "pkg/clash.mjs": "copy\n",
      "pkg/added-here.mjs": "new\n",
      "pkg/lib/legacy/restored.mjs": "old\n",
    }, "copy moves on");
    commitOwner({
      "svc/owner-moved.mjs": "v2\n",
      "svc/both-moved.mjs": lines("ONE", "two", "three", "four", "five"),
      "svc/clash.mjs": "owner\n",
      "svc/owner-only.mjs": "mine\n",
    }, "owner moves on");

    const report = reconcile({ copyRepository: copy, copyPath: "pkg", ownerRepository: owner, ownerPath: "svc", apply: true });
    const outcome = Object.fromEntries(report.files.map((file) => [file.path, file.outcome]));
    assert.deepEqual(outcome, {
      "added-here.mjs": "copy-added",
      "both-moved.mjs": "merged",
      "clash.mjs": "conflict",
      "copy-moved.mjs": "copy-newer",
      "owner-moved.mjs": "owner-newer",
      "owner-only.mjs": "owner-added",
      "same.mjs": "identical",
    });
    const read = (path) => readFileSync(join(owner, "svc", path), "utf8");
    assert.equal(read("copy-moved.mjs"), "v2\n");
    assert.equal(read("owner-moved.mjs"), "v2\n");
    assert.equal(read("both-moved.mjs"), lines("ONE", "two", "three", "four", "FIVE"));
    assert.equal(read("clash.mjs"), "owner\n", "a conflict writes nothing");
    assert.equal(read("added-here.mjs"), "new\n");
    assert.equal(read("owner-only.mjs"), "mine\n", "nothing is deleted from the owner");
    assert.throws(() => readFileSync(join(owner, "svc", "lib/legacy/restored.mjs")), "a legacy subtree inside the copy stays where it is");

    const resolved = reconcile({ copyRepository: copy, copyPath: "pkg", ownerRepository: owner, ownerPath: "svc", apply: true,
      resolutions: { "clash.mjs": { keep: "copy", because: "the copy's wording is the current one" } } });
    const clash = resolved.files.find((file) => file.path === "clash.mjs");
    assert.equal(clash.outcome, "resolved-copy");
    assert.equal(clash.because, "the copy's wording is the current one");
    assert.equal(read("clash.mjs"), "copy\n", "a person's resolution is applied and recorded");
    assert.throws(() => reconcile({ copyRepository: copy, copyPath: "pkg", ownerRepository: owner, ownerPath: "svc", resolutions: { "clash.mjs": { keep: "both" } } }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a manifest whose lines clash merges by its structure, and a value both sides changed stays a conflict", () => {
  const base = JSON.stringify({ name: "p", exports: { ".": "./a.mjs" }, files: ["src"], dependencies: { q: "0.1.0" } }, null, 2);
  const owner = JSON.stringify({ name: "p", exports: { ".": "./a.mjs", "./b": "./b.mjs" }, files: ["src"], dependencies: { q: "workspace:*" } }, null, 2);
  const copy = JSON.stringify({ name: "p", exports: { ".": "./a.mjs", "./c": "./c.mjs" }, files: ["src", "data"], dependencies: { q: "0.1.0", r: "0.2.0" } }, null, 2);
  assert.deepEqual(JSON.parse(mergeJsonText(base, owner, copy)), {
    name: "p", exports: { ".": "./a.mjs", "./b": "./b.mjs", "./c": "./c.mjs" }, files: ["src", "data"], dependencies: { q: "workspace:*", r: "0.2.0" },
  });
  assert.equal(mergeJsonText(base, owner.replace('"p"', '"owner-name"'), copy.replace('"p"', '"copy-name"')), undefined);
  assert.equal(mergeJsonText(base, owner, "not json"), undefined);
});

test("manifests sharing no history merge two ways: a workspace link settles a pinned version, the later version stands", () => {
  const owner = JSON.stringify({ name: "p", version: "0.4.1", dependencies: { q: "workspace:*", s: "workspace:*" } }, null, 2);
  const copy = JSON.stringify({ name: "p", version: "0.4.0", dependencies: { q: "0.1.0", r: "0.2.0" } }, null, 2);
  assert.deepEqual(JSON.parse(mergeJsonText(undefined, owner, copy)), { name: "p", version: "0.4.1", dependencies: { q: "workspace:*", s: "workspace:*", r: "0.2.0" } });
  assert.equal(mergeJsonText(undefined, owner, copy.replace('"name": "p"', '"name": "other"')), undefined);
});
