#!/usr/bin/env node
import { resolve } from "node:path";
import { inventoryLegacyCapabilities, writeLegacyCapabilityLedger } from "../src/legacy-capability-reallocation.mjs";

const [legacyRoot, ...rest] = process.argv.slice(2);
const writeAt = rest.indexOf("--write");
const outputPath = writeAt < 0 ? null : rest[writeAt + 1];
if (!legacyRoot || (writeAt >= 0 && !outputPath)) {
  process.stderr.write("usage: inventory-legacy-capabilities LEGACY_ROOT [--write LEDGER.json]\n");
  process.exitCode = 2;
} else if (outputPath) {
  process.stdout.write(`${JSON.stringify(writeLegacyCapabilityLedger({ legacyRoot, outputPath }), null, 2)}\n`);
} else {
  process.stdout.write(`${JSON.stringify(inventoryLegacyCapabilities({ legacyRoot, repositoryRoot: process.cwd() }), null, 2)}\n`);
}
