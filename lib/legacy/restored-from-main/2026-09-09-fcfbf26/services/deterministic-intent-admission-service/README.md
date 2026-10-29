# deterministic-intent-admission-service

Turns a finite agentic request into an exact, downward-bounded inference-work-lot
intent. Admission is deterministic: the same request always produces the same
intent, and the function refuses model/provider selection, credential-shaped
context, unbounded or cyclic context, missing consideration alternatives, and
any attempt to raise the hard token ceiling.

## Install

```sh
npm install @red-cup-engineering/deterministic-intent-admission-service
```

## Usage

```js
import { admitBoundedAgenticIntent } from "@red-cup-engineering/deterministic-intent-admission-service";

const intent = admitBoundedAgenticIntent({
  taskType: "analysis",
  objective: "determine the bounded answer",
  desiredUse: "produce a customer-assayable result",
  context: { sourceDigests: ["sha256:example"] },
  outputSchema: { type: "object" },
  considerationPolicy: {
    type: "ConsiderationPolicy",
    acceptableAlternatives: [{ id: "internal-credit" }]
  }
});
// => { type: "BoundedInferenceWorkLotIntent", ... }
```

`admitBoundedAgenticIntent` throws a `TypeError` when the request is not
admissible. Request and result shapes are documented in
`content/schemas/admission-request.schema.json` and
`content/schemas/admission-result.schema.json`; refusal shape is in
`content/schemas/admission-refusal.schema.json`.

### CLI

```sh
npx admit-bounded-agentic-intent < request.json
```

Reads a request as JSON on stdin, writes the admitted intent as JSON to
stdout, or exits with an error on refusal.

### HTTP worker

`src/worker.mjs` is a Cloudflare Worker (see `wrangler.jsonc`) exposing:

- `GET /health` — liveness check
- `POST /invoke` — accepts a JSON request body, returns the admitted intent
  (200) or a `DeterministicIntentAdmissionRefusal` (400)

### A2A executor

`src/a2a-executor.mjs` runs the same admission over an A2A JSON-RPC message
whose single part carries a `application/rmn+cbor` payload. It
reads the message as JSON on stdin and writes an A2A response message
carrying the CBOR-encoded intent on stdout.

## Development

```sh
npm run check   # syntax-check the scripts
npm test        # run the test suite
```
