import { createSemanticRecordJournal } from "@red-cup-engineering/eavt/semantic-record";

export const OBJECT_KIND = "red-cup.acceptance-capsule-procurement-service.journal-record";

export function createAcceptanceCapsuleProcurementRecordJournal({ root }) {
  return createSemanticRecordJournal({ root, objectKind: OBJECT_KIND });
}
