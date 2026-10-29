const FORBIDDEN = /^(?:api[-_]?key|access[-_]?token|auth[-_]?token|password|secret|credential|authorization)$/iu;

function finite(value, seen = new Set()) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("canonical RMN values require safe integers");
    return;
  }
  if (typeof value !== "object" || seen.has(value)) throw new TypeError("finite context required");
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN.test(key)) throw new TypeError("forbidden context field");
    finite(child, seen);
  }
  seen.delete(value);
}

function utf8ByteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

export function admitBoundedAgenticIntent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("intent request must be an object");
  }
  if (["requestedModel", "model", "modelId", "provider"].some((key) => Object.hasOwn(input, key))) {
    throw new TypeError("model and provider selection are forbidden");
  }
  if (["maxTokens", "tokenLimit", "tokenBudget"].some((key) => Object.hasOwn(input, key))) {
    throw new TypeError("hard token ceilings are forbidden; consideration policy and observable market pressure govern allocation");
  }
  for (const key of ["taskType", "objective", "desiredUse"]) {
    if (typeof input[key] !== "string" || !input[key]) throw new TypeError(`${key} is required`);
  }
  if (!input.context || typeof input.context !== "object" || Array.isArray(input.context)
      || !input.outputSchema || typeof input.outputSchema !== "object" || Array.isArray(input.outputSchema)) {
    throw new TypeError("finite context and output schema are required");
  }
  finite(input.context);
  finite(input.outputSchema);
  let encoded;
  try {
    encoded = JSON.stringify(input.context);
  } catch {
    throw new TypeError("finite context required");
  }
  if (utf8ByteLength(encoded) > 131072) {
    throw new TypeError("finite context exceeds 131072 bytes");
  }
  const considerationPolicy = input.considerationPolicy;
  if (!considerationPolicy || considerationPolicy.type !== "ConsiderationPolicy"
      || !Array.isArray(considerationPolicy.acceptableAlternatives)
      || considerationPolicy.acceptableAlternatives.length === 0) {
    throw new TypeError("considerationPolicy is required");
  }
  finite(considerationPolicy);
  return Object.freeze({
    type: "BoundedInferenceWorkLotIntent",
    taskType: input.taskType,
    objective: input.objective,
    desiredUse: input.desiredUse,
    context: input.context,
    outputSchema: input.outputSchema,
    constraints: Object.freeze({
      considerationPolicy,
      refinement: "market-pressure",
      upwardEscalationAuthorized: false,
      customerAcceptanceRequired: true
    })
  });
}
