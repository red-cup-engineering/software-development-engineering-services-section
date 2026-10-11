#!/usr/bin/env node
import { purgeLegacyCapabilityArchive } from "../src/legacy-capability-reallocation.mjs";

const [ledgerPath, ...rest] = process.argv.slice(2);
const rootAt = rest.indexOf("--repo-root");
const repositoryRoot = rootAt < 0 ? process.cwd() : rest[rootAt + 1];
if (!ledgerPath || (rootAt >= 0 && !repositoryRoot)) {
  process.stderr.write("usage: purge-legacy-capability-archive LEDGER.json [--repo-root REPOSITORY_ROOT]\n");
  process.exitCode = 2;
} else {
  process.stdout.write(`${JSON.stringify(purgeLegacyCapabilityArchive({ ledgerPath, repositoryRoot }), null, 2)}\n`);
}
