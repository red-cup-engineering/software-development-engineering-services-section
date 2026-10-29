# Computer code development services section

Red Cup Engineering's collection of software-development tooling packages.
This directory is a grouping point only — it holds no shared source code, no
shared dependencies, and no test suite of its own. Each subdirectory under
`services/` is an independently versioned npm package covering one piece of
software-development tooling: repository observation, deployment
record-keeping, Node runtime promotion, package-authority checks, and
similar.

## Install and run

There is nothing to install or run at this level. To use a specific service,
go into its directory and treat it as its own package:

```sh
cd services/<service-name>
npm install
npm test
```

## Usage

See `services/` for the full list of packages and each package's own README
for what it does and how to call it. A few of the more commonly used ones:

- `repository-state-observation-service` — read-only Git status observation,
  routed through the separately owned Git Services Section rather than
  calling Git directly.
- `version-control-services-section` — Git and Git-forge utilities that call
  `/usr/bin/git` directly.
- `deployment-services-section` — a pure, provider-neutral library for
  deployment lifecycle records (solicitation, offer, acceptance, artifact,
  admission). No SDK, CLI, or credentials.
- `node-runtime-release-promotion-service` — atomically moves a deployment
  pointer (e.g. `current`) to a verified release digest and records a receipt
  per transition.
- `write-capability-assay-service` — checks a write-authorization bundle
  (identity, scope, digests) without touching the filesystem.
