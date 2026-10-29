# search-path-for-relations

Bounded filesystem traversal parameterized by a relation-extraction function.
It walks a directory tree, skips symlinks and a default set of noise
directories (`.git`, `node_modules`, `cache`, `out`), and hands each file's
contents to a caller-supplied function that decides what "relations" (if any)
the file contains. The caller owns all semantics; this package only owns the
walk.

## Install

Part of this monorepo — no separate install step. Import it directly by path
or workspace name (`@red-cup-engineering/search-path-for-relations`).

## Usage

```js
import { searchPathForRelations } from "./src/search-path-for-relations.mjs";

const result = await searchPathForRelations({
  path: "./some/directory",
  relationFunction: ({ path, relativePath, source }) => {
    // return one relation object, an array of them, or null/undefined for none
    if (source.includes("TODO")) return { kind: "todo" };
  },
});

result.relations; // [{ path: "nested/file.txt", kind: "todo" }, ...]
```

## API

### `searchPathForRelations(options)`

- `path` (string, required) — root directory to search.
- `relationFunction({ path, relativePath, source })` (function, required) —
  called with each non-excluded file's absolute path, path relative to
  `path`, and UTF-8 contents. Return a relation object, an array of them, or
  `null`/`undefined` for no match. Files containing a NUL byte are skipped
  before this is called.
- `include({ path, relativePath })` (function, optional) — filter deciding
  whether a file is read at all. Defaults to including every file.
- `excludedDirectories` (Set, optional) — directory basenames to skip.
  Defaults to `.git`, `cache`, `node_modules`, `out`.

Returns `{ type: "PathRelationSearch", root, relations }`, where `relations`
is an array of the caller's relation objects, each with a `path` (relative to
`root`) merged in.

## Test

```
npm test
```
