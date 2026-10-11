#!/usr/bin/env node
import { applyLegacyCapabilityAllocations } from "../src/legacy-capability-reallocation.mjs";

const [ledgerPath, declarationsPath] = process.argv.slice(2);
if (!ledgerPath || !declarationsPath) {
  process.stderr.write("usage: allocate-legacy-capabilities LEDGER.json ALLOCATIONS.json\n");
  process.exitCode = 2;
} else {
  process.stdout.write(`${JSON.stringify(applyLegacyCapabilityAllocations({ ledgerPath, declarationsPath }), null, 2)}\n`);
}
