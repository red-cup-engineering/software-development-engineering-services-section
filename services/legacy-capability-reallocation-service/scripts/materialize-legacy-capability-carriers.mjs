#!/usr/bin/env node
import { materializeLegacyCapabilityCarriers } from "../src/legacy-capability-reallocation.mjs";

const [ledgerPath, ...rest] = process.argv.slice(2);
const rootAt = rest.indexOf("--repo-root");
const repositoryRoot = rootAt < 0 ? process.cwd() : rest[rootAt + 1];
if (!ledgerPath || (rootAt >= 0 && !repositoryRoot)) {
  process.stderr.write("usage: materialize-legacy-capability-carriers LEDGER.json [--repo-root REPOSITORY_ROOT]\n");
  process.exitCode = 2;
} else {
  const report = materializeLegacyCapabilityCarriers({ ledgerPath, repositoryRoot });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
