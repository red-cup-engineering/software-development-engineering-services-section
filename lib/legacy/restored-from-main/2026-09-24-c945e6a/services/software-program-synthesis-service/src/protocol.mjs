import { admitJsonSemanticContent, EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/computer-code-engineering-services-section/semiotic-expression-notation/semantic-content-identity";

export const ACTOR = "urn:ame:software-program-synthesis-service";
export const SYNTHESIS_EFFECTS = Object.freeze([
  "provider-local-compute",
  "provider-local-witness-journal",
  "contracted-mission-provider-egress",
]);
const OPERATION_KIND = "software-program-synthesis.operation.v2";

function senId(value) {
  return identifyJsonSemanticContent({
    objectKind: "software-program-synthesis.witness-journal-record",
    value,
    witnessRoot: EMPTY_WITNESS_ROOT,
  }).token;
}
export function record(body) { return Object.freeze({ id: senId(body), ...body }); }
/** The A2A part is a strict JSON carrier.  It is not an RMN/RDF custody document. */
export function operationBytes(value) {
  if (!exactOperation(value)) throw new Error("program operation must be an exact identified record before transport");
  return identifyJsonSemanticContent({ objectKind: OPERATION_KIND, value, witnessRoot: EMPTY_WITNESS_ROOT }).bytes;
}
export function operationFromBytes(bytes) {
  const value = admitJsonSemanticContent({ bytes, objectKind: OPERATION_KIND }).value;
  if (!exactOperation(value)) throw new Error("program operation carrier did not contain one exact identified record");
  return value;
}
export function exactOperation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "id"));
  return value.id === senId(body);
}
