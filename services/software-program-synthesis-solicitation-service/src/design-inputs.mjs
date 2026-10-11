import { join, resolve } from "node:path";
import { eavtRow as entry } from "@red-cup-engineering/eavt-services-section/admit-row";
import { appendEavtEntries } from "@red-cup-engineering/eavt-services-section/append-eavt-entries";
import { readEavtEntries } from "@red-cup-engineering/eavt-services-section/read-eavt-entries";
import { addressDesignMaterial } from "./semantic-content.mjs";
import { walkPosixPathsSync } from "@red-cup-engineering/computer-filepath-engineering-services-section/walk-posix-paths";

const FEED = "software-design-inputs";
export const ADMITTED_DEMAND_CATEGORY = "software-design.admitted-demand";
export const REQUIREMENTS_AUTHORITY_CATEGORY = "software-design.requirements-authority";

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be one object`);
  return value;
}
function texts(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string").map(String) : [];
}
function cloneOrNull(value) {
  return value === undefined ? null : structuredClone(value);
}
function filesBelow(directory) {
  return walkPosixPathsSync({ root: directory, missing: "empty", paths: "absolute", result: "paths", symlinks: "skip", includeFile: ({ name }) => name === `${FEED}.jsonl` }).files;
}

export function projectSoftwareDesignInputs({ actor, contract, effects, grant, offer, request }) {
  object(contract, "software design contract");
  object(grant, "software design resource authority");
  object(offer, "software design offer");
  object(request, "software design request");
  const program = object(request.program, "software design program");

  const admittedDemand = addressDesignMaterial("software-design.admitted-demand", {
    type: "SoftwareDesignAdmittedDemand",
    provider: actor,
    customer: contract.customer,
    solicitation: offer.solicitation,
    request: request.id,
    program: program.id,
    objective: typeof program.objective === "string" ? program.objective : null,
  });
  const requirementsAuthority = addressDesignMaterial("software-design.requirements-authority", {
    type: "SoftwareDesignRequirementsAuthority",
    admittedDemand: admittedDemand.id,
    offer: offer.id,
    resourceGrant: grant.id,
    issuer: grant.issuer,
    holder: grant.holder,
    requiredEffects: [...effects],
    grantedEffects: texts(grant.effects),
  });
  const designConstraints = addressDesignMaterial("software-design.constraints", {
    type: "SoftwareDesignConstraints",
    requirementsAuthority: requirementsAuthority.id,
    territory: typeof program.territory === "string" ? program.territory : null,
    requiredFocusPaths: texts(program.requiredFocusPaths),
    requiredAcceptanceKeys: texts(program.requiredAcceptanceKeys),
    requiredMissionBundles: cloneOrNull(program.requiredMissionBundles),
  });
  const compositionSearch = addressDesignMaterial("software-design.composition-search", {
    type: "SoftwareDesignCompositionSearchDemand",
    designConstraints: designConstraints.id,
    missionPlan: cloneOrNull(program.missionPlan),
    plannerCount: Number.isInteger(program.plannerCount) ? program.plannerCount : null,
    routingProfile: typeof program.missionRoutingProfile === "string" ? program.missionRoutingProfile : null,
  });
  const proofObligations = addressDesignMaterial("software-design.proof-obligations", {
    type: "SoftwareDesignProofObligations",
    designConstraints: designConstraints.id,
    requiredAcceptanceKeys: texts(program.requiredAcceptanceKeys),
    requiredMissionBundles: cloneOrNull(program.requiredMissionBundles),
  });
  const receiverTests = addressDesignMaterial("software-design.receiver-test-demands", {
    type: "SoftwareDesignReceiverTestDemands",
    proofObligations: proofObligations.id,
    verifyCommand: typeof program.verifyCommand === "string" ? program.verifyCommand : null,
    acceptanceCommand: typeof program.acceptanceCommand === "string" ? program.acceptanceCommand : null,
    acceptanceCatalog: cloneOrNull(program.acceptanceCatalog),
  });
  const fabrication = addressDesignMaterial("software-design.fabrication-demand", {
    type: "SoftwareDesignFabricationDemand",
    compositionSearch: compositionSearch.id,
    receiverTests: receiverTests.id,
    territory: typeof program.territory === "string" ? program.territory : null,
  });

  return Object.freeze({
    admittedDemand,
    requirementsAuthority,
    designConstraints,
    reusableAddressedAtoms: Object.freeze([program.id, admittedDemand.id, requirementsAuthority.id, designConstraints.id]),
    compositionSearch,
    proofObligations,
    receiverTests,
    fabrication,
    operationalEvidence: null,
  });
}

export function createSoftwareDesignInputJournal({ root } = {}) {
  if (typeof root !== "string" || root.length === 0) throw new TypeError("software design input journal requires an explicit custody root");
  const custodyRoot = resolve(root);
  return Object.freeze({
    record(designInputs, recordedAt) {
      object(designInputs, "software design inputs");
      if (!Number.isFinite(Date.parse(recordedAt ?? ""))) throw new TypeError("software design input journal requires a finite recordedAt");
      const rows = [
        entry({e: designInputs.admittedDemand.id, a: ADMITTED_DEMAND_CATEGORY, v: designInputs.admittedDemand, t: recordedAt}),
        entry({e: designInputs.requirementsAuthority.id, a: REQUIREMENTS_AUTHORITY_CATEGORY, v: designInputs.requirementsAuthority, t: recordedAt}),
      ];
      return appendEavtEntries({root: custodyRoot, feed: FEED, entries: rows, at: recordedAt});
    },
    query(category) {
      const rows = [];
      for (const path of filesBelow(join(custodyRoot, "data", "logs"))) {
        for (const row of readEavtEntries({path})) if (row.a === category) rows.push(structuredClone(row.v));
      }
      return Object.freeze(rows);
    },
  });
}
