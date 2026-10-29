import { createSemanticRecordJournal } from "@red-cup-engineering/semantic-record-journal-service";

export const OBJECT_KIND = "red-cup.deterministic-intent-compiler-supplier.journal-record";

export function createDeterministicIntentCompilerSupplierRecordJournal({ root }) {
  return createSemanticRecordJournal({ root, objectKind: OBJECT_KIND });
}
