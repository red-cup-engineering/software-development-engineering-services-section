import {
  EMPTY_WITNESS_ROOT,
  IDENTITY_SETTLEMENT_PROFILE,
  identifyJsonSemanticContent,
  SEN_NORMALIZATION_PROFILE,
} from "@red-cup-engineering/computer-content-address-engineering-services-section/semantic-content-identity";

export function addressDesignMaterial(objectKind, value) {
  if (typeof objectKind !== "string" || objectKind.length === 0) throw new TypeError("design material requires an object kind");
  const identified = identifyJsonSemanticContent({ objectKind, value, witnessRoot: EMPTY_WITNESS_ROOT });
  if (identified.envelope.normalizationProfile !== SEN_NORMALIZATION_PROFILE
      || identified.envelope.settlementProfile !== IDENTITY_SETTLEMENT_PROFILE) {
    throw new TypeError("design material identity used an unexpected profile");
  }
  return Object.freeze({ ...structuredClone(value), id: identified.token });
}
