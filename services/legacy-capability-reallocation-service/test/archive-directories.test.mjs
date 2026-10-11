import assert from "node:assert/strict";
import test from "node:test";

import { readArchiveDirectories } from "../src/legacy-capability-reallocation.mjs";

test("archive directories read from tracked paths, nested and placed against their legacy roots", () => {
  const archives = readArchiveDirectories([
    "archive/child/_archive/notes.md",
    "archive/readme.md",
    "nearly-archive/kept.md",
    "section/content/_archive/old.md",
    "section/lib/legacy/2026-08-17-snapshot/projects/archive/plan.md",
    "section/lib/legacy/archive/loose.md",
    "tools/archive",
  ]);
  assert.deepEqual(archives, [
    { path: "archive", name: "archive", nestedUnder: null, legacyRoot: null, legacyState: "outside-legacy" },
    { path: "archive/child/_archive", name: "_archive", nestedUnder: "archive", legacyRoot: null, legacyState: "outside-legacy" },
    { path: "section/content/_archive", name: "_archive", nestedUnder: null, legacyRoot: null, legacyState: "outside-legacy" },
    { path: "section/lib/legacy/2026-08-17-snapshot/projects/archive", name: "archive", nestedUnder: null, legacyRoot: "section/lib/legacy/2026-08-17-snapshot", legacyState: "inside-legacy" },
    { path: "section/lib/legacy/archive", name: "archive", nestedUnder: null, legacyRoot: "section/lib/legacy/archive", legacyState: "inside-legacy" },
  ]);
  assert.deepEqual(readArchiveDirectories([]), []);
});
