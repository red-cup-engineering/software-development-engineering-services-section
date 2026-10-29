import { createSemanticRecordJournal } from "../../../../../../computer-data-engineering-services-section/services/serialized-computer-data-engineering-services-section/services/json-services-section/services/jsonl-services-section/services/eavt-services-section/services/seavt-services-section/src/semantic-record.mjs";

export const OBJECT_KIND = "red-cup.acceptance-oracle-assay-service.journal-record";

export function createAcceptanceOracleAssayRecordJournal({ root }) {
  return createSemanticRecordJournal({ root, objectKind: OBJECT_KIND });
}
