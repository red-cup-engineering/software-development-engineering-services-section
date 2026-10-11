import assert from "node:assert/strict";
import { posix } from "node:path";
import test from "node:test";
import { exclusions } from "../scripts/retire-wave.mjs";

test("the exclusions leave exactly the admitted owner packages of the mounted forest in the workspace", () => {
  const packages = new Set(["m", "m/a", "m/a/x", "m/a/y", "m/b", "m/b/z", "m/c"]);
  assert.deepEqual(exclusions("m", packages, []), ["!m", "!m/**"]);
  assert.deepEqual(exclusions("m", packages, ["m/a/x"]), ["!m", "!m/a", "!m/a/y", "!m/a/y/**", "!m/b", "!m/b/**", "!m/c", "!m/c/**"]);
  assert.deepEqual(exclusions("m", packages, ["m/a", "m/b/z"]), ["!m", "!m/a/x", "!m/a/x/**", "!m/a/y", "!m/a/y/**", "!m/b", "!m/c", "!m/c/**"]);
  // Read as the lockfile freshness check reads them (node's path.matchesGlob), they leave exactly the admitted packages.
  for (const admitted of [[], ["m/a/x"], ["m/a", "m/b/z"]]) {
    const patterns = exclusions("m", packages, admitted).map((line) => line.slice(1));
    const left = [...packages].filter((dir) => !patterns.some((pattern) => posix.matchesGlob(dir, pattern)));
    assert.deepEqual(left.sort(), [...admitted].sort());
  }
});

test("a wave moves a copy's own files under legacy, leaves a repository mounted inside it, and admits the owner", async () => {
  const { execFileSync } = await import("node:child_process");
  const { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join, dirname } = await import("node:path");
  const { retireWave } = await import("../scripts/retire-wave.mjs");
  const root = mkdtempSync(join(tmpdir(), "retire-wave-"));
  const git = (...args) => execFileSync("git", ["-C", root, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8" });
  const put = (path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
  try {
    git("init", "-q");
    const copy = "lib/emsenn/services/561-group/services/a/pkg";
    put(`${copy}/package.json`, JSON.stringify({ name: "@t/pkg", exports: { ".": "./src/index.mjs", "./x": "./src/index.mjs" } }));
    put(`${copy}/src/index.mjs`, "export const x = 1;\n");
    put(`${copy}/lib/legacy/old.mjs`, "old\n");
    put("lib/emsenn/services/561-group/services/b/package.json", JSON.stringify({ name: "@t/user" }));
    put("lib/emsenn/services/561-group/services/b/use.mjs", 'import "../a/pkg/src/index.mjs";\n');
    put("mount/svc/pkg/package.json", JSON.stringify({ name: "@t/pkg", dependencies: { "@t/only-owner": "1" } }));
    put("mount/svc/only/package.json", JSON.stringify({ name: "@t/only-owner" }));
    put("mount/svc/other/package.json", JSON.stringify({ name: "@t/other" }));
    put("pnpm-workspace.yaml", 'packages:\n  - "lib/**"\n  - "!mount/**"\n');
    git("add", "-A");
    git("update-index", "--add", "--cacheinfo", `160000,${"1".repeat(40)},${copy}/inner-repo`);
    git("commit", "-q", "-m", "base");
    const census = { packages: { "@t/pkg": { owner: { path: "svc/pkg" }, copies: [{ path: copy }] } }, openPullRequests: {}, waves: [{ wave: 1, names: ["@t/pkg"] }] };
    const options = { census, wave: 1, repository: root, mount: "mount", ownerName: "owner" };
    const refused = retireWave(options);
    assert.deepEqual(refused.broken.map((row) => row.specifier), ["../a/pkg/src/index.mjs"], "a relative import into the copy is reported");
    assert.throws(() => retireWave({ ...options, write: true }), /would break/u);
    put("lib/emsenn/services/561-group/services/b/use.mjs", 'import "@t/pkg/x";\n');
    assert.deepEqual(retireWave(options).broken.map((row) => row.specifier), ["@t/pkg/x"], "an export the owner dropped is reported");
    assert.throws(() => retireWave({ ...options, write: true }), /would break/u);
    put("mount/svc/pkg/package.json", JSON.stringify({ name: "@t/pkg", exports: { ".": "./i.mjs", "./x": "./i.mjs" }, dependencies: { "@t/only-owner": "1" } }));
    const result = retireWave({ ...options, write: true });
    const moved = git("ls-files").split("\n");
    assert.ok(moved.includes("lib/emsenn/services/561-group/lib/legacy/retired-for-owner/wave-1/services/a/pkg/src/index.mjs"));
    assert.ok(moved.includes(`${copy}/inner-repo`), "the mounted repository stays where it is");
    assert.ok(moved.includes(`${copy}/lib/legacy/old.mjs`), "the copy's own legacy tree stays where it is");
    assert.deepEqual(result.admitted, ["mount/svc/only", "mount/svc/pkg"], "the owner package and what only the owner defines join");
    assert.match(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"), /"!mount\/svc\/other\/\*\*"/u);
    assert.ok(!existsSync(join(root, copy, "src/index.mjs")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
