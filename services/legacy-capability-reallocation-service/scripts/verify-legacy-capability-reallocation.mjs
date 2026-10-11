#!/usr/bin/env node
import { verifyLegacyCapabilityReallocation } from "../src/legacy-capability-reallocation.mjs";

const [ledgerPath, ...rest] = process.argv.slice(2);
const rootAt = rest.indexOf("--repo-root");
const repositoryRoot = rootAt < 0 ? process.cwd() : rest[rootAt + 1];
if (!ledgerPath || (rootAt >= 0 && !repositoryRoot)) {
  process.stderr.write("usage: verify-legacy-capability-reallocation LEDGER.json [--repo-root REPOSITORY_ROOT]\n");
  process.exitCode = 2;
} else {
  const report = verifyLegacyCapabilityReallocation({ ledgerPath, repositoryRoot });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}
