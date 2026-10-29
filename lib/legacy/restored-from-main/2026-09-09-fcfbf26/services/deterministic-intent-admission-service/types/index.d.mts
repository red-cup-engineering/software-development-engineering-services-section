export interface ConsiderationPolicy {
  type: "ConsiderationPolicy";
  acceptableAlternatives: unknown[];
  [key: string]: unknown;
}

export interface BoundedAgenticIntentRequest {
  taskType: string;
  objective: string;
  desiredUse: string;
  context: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  considerationPolicy: ConsiderationPolicy;
}

export interface BoundedInferenceWorkLotIntent {
  type: "BoundedInferenceWorkLotIntent";
  taskType: string;
  objective: string;
  desiredUse: string;
  context: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  constraints: {
    considerationPolicy: ConsiderationPolicy;
    refinement: "market-pressure";
    upwardEscalationAuthorized: false;
    customerAcceptanceRequired: true;
  };
}

export declare function admitBoundedAgenticIntent(input: BoundedAgenticIntentRequest): BoundedInferenceWorkLotIntent;
