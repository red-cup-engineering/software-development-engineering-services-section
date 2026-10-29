import { createSemanticRecordJournal } from "@red-cup-engineering/eavt/semantic-record";

export const OBJECT_KIND = "red-cup.improvement-game-design-supplier.journal-record";

export function createImprovementGameDesignSupplierRecordJournal({ root }) {
  return createSemanticRecordJournal({ root, objectKind: OBJECT_KIND });
}
