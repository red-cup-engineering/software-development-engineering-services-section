# acceptance-oracle-assay-service

Deterministic assay of bounded acceptance-oracle evidence.

Given a manifest of source evidence, a set of declared test-vector IDs, an
oracle's test artifacts, and a "red" (should-fail) execution witness, this
service checks that the pieces bind together correctly: every file's digest
matches its claimed bytes, every declared test vector is covered by the red
witness, and the red witness actually failed as required. It does not run
the oracle, evaluate whether the oracle is any good, or grant product or
capsule acceptance — it only reports whether the submitted evidence is
internally consistent, as a signed receipt.

It is exposed both as a plain JS library and as an A2A (agent-to-agent)
service.

## Install

```
npm install
```

## Run the tests

```
npm test
```

## Run as an A2A service

```
node scripts/server.mjs
```

Configuration is via environment variables:

- `PORT` (default `19845`)
- `HOST` (default `127.0.0.1`)
- `BASE_URL` (default `http://<host>:<port>`)

The service is registered under `bin` as `serve-acceptance-oracle-assay-a2a`.

To run a single A2A task against stdin/stdout (used as the executor behind
the server, and useful for debugging):

```
node scripts/execute-a2a-task.mjs < message.json
```

or via the `execute-acceptance-oracle-assay-a2a-task` bin entry.

## Usage as a library

The package's public entry point (`.` / `./client`) is the A2A client. Call
a deployed assay service instead of assaying locally:

```js
import { requestAcceptanceOracleAssay } from "@red-cup-engineering/acceptance-oracle-assay-service";

const { receipt, assay } = await requestAcceptanceOracleAssay({ manifest, oracle });
```

`manifest` is `{ testVectors: [{ id, ... }], sourceEvidence: [{ path, digest, bytes }] }`.
`oracle` is `{ artifacts: [{ path, digest, bytes, text }], redWitness: { passed, output, outputDigest, executedVectorIds } }`.

`agentUrl` defaults to the Agent Card at
`https://bare-cedar-fog.561.group/a2a/acceptance-oracle-assay/.well-known/agent-card.json`
and can be overridden via the `ACCEPTANCE_ORACLE_ASSAY_AGENT_CARD_URL` environment
variable or the `agentUrl` option.

`assayAcceptanceOracle` (`src/assay.mjs`) is the pure assay function itself,
and `src/protocol.mjs` has the request/receipt encoding
(`encodeRequest`, `decodeRequest`, `performAssay`, `decodeReceipt`). Both are
internal to this package (not part of its public `exports`) and are used by
the client and the server executor.

## Deployment metadata

- `content/agent-cards/` — the A2A Agent Card served by this deployment.
- `content/agent-card-signing/` — the Agent Card's signing JWKS.
- `content/foam/locus.json` and `content/offers/current.json` — this
  service's registration in the surrounding actor/offer model.
- `data/records/systemd/` — the systemd unit used to run this service in
  production.
