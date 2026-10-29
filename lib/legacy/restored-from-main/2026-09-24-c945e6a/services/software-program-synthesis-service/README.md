# Software Program Synthesis Service

An A2A provider that turns a bounded software objective into an implemented
program change. A customer sends a solicitation naming a program (an
objective, a repository territory or immutable GitHub source, and an
acceptance catalog); the service offers a synthesis contract back. Once the
customer returns a signed contract with a resource grant that covers the
service's effects, it runs a standards-driven engineering-design pipeline
(prior-art synthesis through low-level design and a verification and
validation specification), derives an execution plan and its mission
dependency geometry from that design, executes the plan's missions through a
software-mission-execution provider, and returns a program delivery that is
awaiting the customer's own acceptance. The service never claims to have
integrated a change into the customer's territory itself.

## Install

```
npm install
```

## Run

- `serve-software-program-a2a` starts the A2A HTTP/JSON-RPC and REST server
  (`scripts/serve-a2a.mjs`). It reads `HOST`/`PORT` for its listen address,
  `BASE_URL` for its advertised agent card URL, and
  `SOFTWARE_PROGRAM_SYNTHESIS_EVIDENCE_ROOT` for where it journals mission
  execution events.
- `execute-software-program-a2a-message` reads one A2A message as JSON on
  stdin, executes it, and writes the response message to stdout
  (`scripts/execute-a2a-message.mjs`).

## API

- `./client` — `synthesizeSoftwareProgram(program, options)` sends the
  solicitation/contract exchange to a provider's agent card URL and returns
  the settled delivery, including both transport receipts.
- `./executor` — `executeA2aMessage`, `executeOperation`, and
  `executeContractedSoftwareProgramSynthesis`: the provider side of that
  exchange.
- `./protocol` — shared protocol pieces: `ACTOR`, `SYNTHESIS_EFFECTS`,
  `record`, `exactOperation`, and the JSON operation carrier codec
  (`operationBytes` / `operationFromBytes`).
- `./program-runtime` — `runProgram` and `compileProgram` run the engineering
  design and mission execution pipeline; `validatePlan` and
  `deriveExecutionGeometry` check and schedule a mission plan;
  `deriveEngineeringExecutionContract` extracts the accepted low-level
  design's implementation paths and the accepted V&V specification's
  acceptance command.
- `./execution-circuit` — `projectExecutionGeometryCircuit` and
  `assayExecutionGeometryCircuit` project a program's mission execution
  geometry to a verifiable hierarchical circuit; `measureExecutionEconomy`
  totals the inference cost a run purchased.

## Test

```
npm test
```
