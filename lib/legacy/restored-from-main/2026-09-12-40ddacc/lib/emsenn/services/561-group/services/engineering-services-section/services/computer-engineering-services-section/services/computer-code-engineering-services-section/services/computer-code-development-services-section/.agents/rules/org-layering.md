<!-- Generated from @red-cup-engineering/agent-root-instructions-projection-service/content/rules/org-layering.md. Edit the package source. -->

# Org layering (owner-stated, 2026-08-30)

**computer-data, computer-code, and computer-networking are furthest
upstream; computer-systems composes them; everything else specializes
computer-systems (owner-ruled 2026-09-06, stated to end a recurring
failure: "I end up having to say next session 'P should be like Y!' and
this goes on for like a week" — X gets corrected, and P, Q, R, S, T turn
out to be the same unfixed duplicate, one session at a time).** The
stack, verbatim: "furthest upstream: computer data, code, networking.
computer systems composes that. everything else should be a
specialization of computer systems, data, code, networking, into a
specific domain." Concretely: literally everything seated under
computer-systems (any `computer-*-systems-*-services-section`, and every
section beneath it) uses computer-data, computer-code, and
computer-networking for its logic and its classes rather than
reimplementing a type, parser, codec, transport, or data structure those
three already own; computer-systems is the composition of those three, not
a fourth place that grows its own copies; and a domain section outside
computer-systems (a game, a science topic, an enterprise capability) is a
specialization of computer-systems plus data/code/networking, never an
origin of its own systems-level primitives. This machine and this repository
are themselves a computer system, so bare-cedar-fog's own machine-layer
code (the Claude/Codex harness services, systemd units, the registry) is
in scope for the same law: it relies on what computer-systems already
provides rather than growing a parallel copy because it happens to be "the
devbox" rather than "a domain."

**A services-section IS the package; never fragment its scripts into
sibling single-function packages (owner-ruled 2026-09-06):** owner
verbatim: "It looks like you're doing weird, single-function
verb-noun-service, when those should be like, noun-services-section/
scripts/verb-noun.mjs... a services-section contains src/ for any shared
source files, scripts/ for single-effect/transform functions, apps/ for
the application face (CLI, usually) over it." A `<noun>-services-section`
directory holding no `package.json` of its own, whose only children are N
separate `<verb>-<noun>-service` packages each with its own package.json,
node_modules, and registry version — is the disease this rule names.
Live measured example (2026-09-06): `javascript-argv-parsing-services-section`
and `javascript-node-standard-stream-services-section` are both bare
namespace folders with no package.json, each containing 2 single-function
sibling packages (`parse-javascript-argv-service` +
`project-javascript-argv-tail-service`; `read-javascript-node-standard-input-text-service`
+ `write-javascript-node-standard-output-text-service`) that should be one
`scripts/<verb>-<noun>.mjs` each inside one section package. The fix is
never to publish a new single-function package beside an existing one in
the same section; a new verb for an existing noun is a new script in the
existing section's `scripts/`, and an existing fragmented section is
retrofitted by giving the section itself the package.json, moving every
sibling package's `scripts/`+`test/` into it, and re-pinning every
consumer — sized properly (measured 2026-09-06:
`read-javascript-node-standard-input-text-service` has 74 consumer
package.json files, `write-javascript-node-standard-output-text-service`
60, `parse-javascript-argv-service` 33) and run as a dependency-ordered
`publish-train`, never attempted as a blind single-turn edit at that
scale.

**The point is downstream-duplication removal, not per-session leaf
fixes (owner-ruled 2026-09-06, verbatim):** "I don't care if shit is done
*right*, this session: I care that it is done in a way that avoids
duplicating logic and data structures in downstream packages when
upstream packages should own them... remove duplicate logic and data
types by ensuring they are well-written upstream and then circulated
downstream, such that the meaningful complexity and size of the
repository goes down." A session that finds a live example of this law
(a computer-systems-scoped package reimplementing a data type, codec, or
transport computer-data/computer-code/computer-networking already owns)
does not stop at fixing that one package: it treats the finding as
evidence of a duplication CLASS, inspects affected contracts and consumers to find every consumer of the duplicate, and migrates the class to the upstream owner. Seating one
more agent, office, or harness leaf — however real its underlying
mechanism — is not this work and must not be reported as though it were
(owner-ruled 2026-09-06, naming a same-session example: an office
installed and correctly seated is still "thin shit" relative to this law
if the session frames it as the architectural fix the founder asked for).

**The section shape (owner-stated, 2026-08-30) — how anything is found:**
every capability topic gets ONE engineering section holding everything
about it, discoverable by walking the taxonomy with plain questions
("code for doing stuff? engineering. computer stuff? computer-
engineering. data? computer-data. EAVT? here's everything about EAVT").
A topic section (e.g. `eavt-engineering-services-section`) carries:
`src/<topic>.mjs` (the domain semantics and public algebra), executable
`scripts/<verb>-<noun>.mjs` (one operation per transformation/effect) and
`scripts/<verb>-set-of-<nouns>.mjs` collection lifts, `apps/<topic>-cli.mjs`
(the richer composed face), and admitted executable or declarative schemas
under `data/records/schema/`. Scripts import src and other scripts; apps
compose scripts and src. A child section enriches or composes its parent's
capability instead of copying the parent's operations into another flat
package. `content/.../teaching-articles/explanations/` carries the true
teaching document. Grab-bag packages ("computer") that pile
unrelated capabilities behind one vague name are the disease; their
capabilities split out to topic sections, consumers migrating one at a
time, never on momentum.

**Data formats seat in computer-data (owner-ruled 2026-09-04):** an envelope
or record format (CloudEvents, JSON-LD, CBOR, Beancount text) is data
"pre-wire, pre-file", so it gets its own engineering section under
computer-data beside the format it profiles (CloudEvents beside JSON Schema
under json-services-section), and its operations compose computer-data's
own scripts (the JSON Schema validator over the specification's published
schema, canonical JSON, ni: identity) rather than hand-writing rules.
computer-networking holds transports and bindings (the HTTP binding of an
envelope), never the envelope's format.

**The engine hierarchy (owner-stated 2026-09-04, verbatim):** "We have many
layers of MUD engines and libraries. MARSH engine (EVM); MetroPlat
enterprise/business library. LAGOON engine (Guile over Node, for
multi-systems deployment). FAE (same Node, but run single-system; this is
why doing things according to my very particular rules matters)." So: FAE
runs one system on Node; LAGOON runs many systems, Guile mapping over the
same Node leaves; MARSH is the EVM engine above them; MetroPlat is the
business library over MARSH; ops.561.group is a MetroPlat instance. A
session is a player in that MUD, and its tool surface should be those
engines' verbs.

**THE RULE for scripts/ and src/ (owner-ruled 2026-09-04, verbatim):** "what
goes in scripts/? ... scripts/ only ever has scripts that are scripts. A
script is a script: you run it, shit goes in, shit comes out, maybe 1
effect. Nothing in scripts/ should ever work different. src/ also very
standard; we have world-class research on this." Everything a script needs
in order to be that (its terms, explanations, tutorials, guides, references)
lives in the section's content/, never in the script. Hundreds of thousands
of nonconformant lines exist; they are paid down by a checker that measures
conformance and a fabricator that only births conformant scripts, never by
hand. The stack this serves, owner verbatim: ops.561.group is a MetroPlat
instance; MetroPlat is a library over MARSH; MARSH is a smart-chain
resource-sharing hub over LAGOON, our Guile over Node, our flatfile agent
engine. So a node operations graph holds the operations (fabricated
operation packages, their work orders and receipts), MetroPlat reads that
graph, and no app imports an operation package directly to "use" it.
jsnode-server is that graph's dev-box face and must carry the fabrication
line; "grep for shit" is not context discovery.

**MetroPlat is a library, not the place code lands (owner-ruled 2026-09-04,
verbatim intent):** "MetroPlat is meant to be a LIBRARY over MARSH, which is
meant to be an EVM smart contract MUD that runs over LAGOON." Every session
that makes metroplat "carry more and more" is the failure: "atomic scripts/,
apps compose them"; "functions take in one schematicized JSON object, put
out another"; "categories with carriers and transformers". A new capability
lands in its topic section (live examples the owner named:
`agent-work-computer-system-engineering-services-section/src/work-item.mjs`,
`agent-enterprise-plan-engineering-services-section/scripts/make-plan.mjs`)
as `src/` algebra plus `scripts/<verb>-<noun>.mjs` with JSON Schema in and
out, published once on the registry; metroplat composes it as a thin verb.
Before repairing anything, look for the richer code that already exists
here, on cold-red-gate, or on GitHub, and improve and standardize that. The
corporate idea this serves: semioverse is our fediverse; A2A with x402 is
our exchange; the standards are the product.

**MetroPlat is a MARSH library: a bundle of smart contracts (owner-stated
2026-09-05; ruling record `561-group-services-section/data/records/2026-09-05-ruling-metroplat-is-a-marsh-library.json`):** "Everything MetroPlat currently has is exactly what is meant to be
these scripts that everyone can share, offered and traded as microservices BY
metroplat, who assembles them." So a capability found implemented inside
metroplat (a workbench, a codec, a walker, a journal writer) is not metroplat's
to keep: it is an operation package in its topic section, with its contract
beside it (`lib/contracts/<function>.sol`, rule 1 above), and metroplat's only
relation to it is assembly and trade — listing it, pricing it, settling its
calls. Measured 2026-09-05 as the gap this ruling names: metroplat's
`src/integrations/*/services/` holds 253 service files and its `src/` 168,178
lines of TypeScript; 29 of those 253 files import any house registry package.
Adding a rule, a guard, or a fix inside metroplat (the 2026-09-05 data-root
refusal is the live example) grows the wrong body; the lawful move is the
operation package plus the thin verb.

**The problem is the opaque package, not the language (owner-stated
2026-09-05, correcting a same-night session reading; ruling records
`2026-09-05-ruling-the-problem-is-the-opaque-package.json`,
`2026-09-05-ruling-knowledge-is-schema-pointing-at-schema.json`,
`2026-09-05-ruling-standardize-how-code-and-knowledge-are-written.json`
under `561-group-services-section/data/records/`, validated against
`data/records/schema/ruling.schema.json` there; the glossary term is
`operations-services-section/content/text/glossary/terms/ruling.md`):** "The 'typescript when
it shouldn't be typescript' is not the issue... 'it's all part of one giant
opaque package that does a bunch of shit in ways that are not at all like how
the user asked, any theory supports, and you keep fucking polishing it' is
the fucking problem." And the shape it must have instead: "JUST MAKE THINGS
WORK LIKE A FUCKING MUD ENGINE AND LIBRARY... ECS. Messaging. STANDARD
SYSTEMS SHARED BY SHIT TO DO SHIT TOGETHER." That shape is already specified
in the tree, not to be reinvented: the 2026-04-05 note
`engineering-services-section/services/computer-engineering-services-section/content/text/documents/notes/2026-04-05-note-on-mud-framework-autonomous-worlds-analysis.md`
reads Lattice's MUD framework against EAVT and rules "This is not a metaphor.
The data structures are the same." One **World** (kernel and namespaces);
one **Store** of typed, schema'd tables (EAVT rows here); **Systems** that
are stateless, hold no memory, read the Store, compute, write back, and are
upgraded by re-registering under the same name; **Modules** that install
sets of Systems and tables into a World. Companion carriers:
`ontology-of-work-operations.md` (ECS is structurally an EAV work store), the
office specification (office as static role versus character as live
instance is the ECS split), and the FeltOS kernel (world, lisp, persistence,
federation). Read against that: a MetroPlat verb is a System, its state
belongs in Store tables, its calls and events are World messaging, and
MetroPlat itself is a Module. Measured 2026-09-05: metroplat's `src/` holds
168,178 lines in one package, 253 service files, 29 of them importing any
house registry package. Polishing a file inside that package (schema files,
built-in rewrites, a guard in its config) is not standardization; the first
standardization lot on it decides, per service file, which System it is and
which Store tables it reads and writes, and moves it out as one.

**Repetition is priority (owner-stated 2026-09-05):** "make work
orchestration shit so that if i keep having to say shit, it amplifies the
importance." A founder ask recovered more than once from transcripts or
prompts is by that count at least Necessary (work-orchestration
specification, transcript-derived requirements), and the rail carries the
count as evidence; a session that hears an ask for the nth time and changes
a leaf's jargon has not admitted it.

**Where knowledge about our systems lives (owner-stated, 2026-08-30):**
dated records in `561-group-services-section/data/records/*`, DERIVED by
real engineering/operations software (the measuring scripts live in
their engineering sections), and READ INTO the Guile world. Never a
print-to-terminal inventory script at repo root, never facts baked into
source, never session archaeology.

**The language law (owner-stated, 2026-08-30) — apply before writing any
code:** Does it (1) I/O with a system, or (2) transform data? Then it is
written in Node. Does it map our devops and prod? Then it is written in
Guile. No middle category, no engine-code exception. The engine is
**LAGOON — Locally Articulated Guix Operations Over Node**
(owner-ratified 2026-08-30; the expansion states this law itself),
formerly working-named qtOps = "qualified thing Operations"; path and
spec renames execute as one change once in-flight builds land. LAGOON
is a Modeled Unix Dimension written in Guile: the live
Guile-resident map of the org's actual machines, services, deploys, and
their drift — the same system-as-value move Guix makes for the built
system, extended to the running one. Guile maps; Node actuates; the
membrane is the mapper's one verb for reaching actuators. Applying it
honestly (two same-day violations documented): listing, filtering, and
deduplicating ARE data transformation — Node, always; the world's
content lives as rows in the trace on disk, never as constants in Guile
source; there are NO per-domain Guile modules (a world.scm, a
services.scm — that shape is the deleted Atlas application growing
back); and a Node-side gap gets fixed in the owning Node package
through the publish gate, never bypassed with Guile-side computation.

1. **Every obsmetrologic function gets its own services section**, with
   `scripts/<function>.mjs` and `lib/contracts/<function>.sol`. The `.sol`
   contract belongs IN the function service — EVM contracts beside their
   function are correct shape, not contamination.
2. **These compose as Metrologic** (`@lenticule-science/metrologic`, the app
   at `obsmetrological-services-section/apps/metrologic`) — the JSNode-native
   form of Obsmetrologia (Lean, proof root) / PyMetrologic (Python).
   Metrologic is an APP over a PROOF TREE (owner-stated 2026-08-30): the
   sections mirror Obsmetrologia's proof structure — each section a locus
   of the Lean formalization of Relationality, the Lakotaean metaphysics —
   carrying that concept's functions as `scripts/` and its carriers as
   `src/` (e.g. an articulating locus with `scripts/articulate.mjs`,
   `src/mark.mjs`, nested positing loci beneath). Seating math is
   therefore a LOOKUP, not a custody debate: find the function's
   theorem-locus (the Lean module that formalizes it — Settlement,
   Cohomology, Site, Closure, ...) and seat it at that node; metrologic
   composes the nodes into the math app.
3. **Metrologic provides the math app to anyone that needs it.**
4. **qtOps is a Guile MUD engine that uses Metrologic and other scripts as
   its leaves.** "Node as the actuators, Guile as the mapper." qtOps ports
   nothing that exists as a Node package; a Guile-resident value is a
   projection of the Node leaf's answer, never a second implementation.
   This has NO engine-code exception (owner re-ruled 2026-08-30 after an
   agent rationalized one): substrate laws are outsourced through the
   membrane to their owning registry packages like any other leaf —
   rows/append/fold in `@red-cup-engineering/computer` (the
   `@561-group/computer` name is stale registry history), canonical CBOR
   in `@red-cup-engineering/cbor-codec-service`, `ni:` identity in
   `@red-cup-engineering/cbor-ni-service`. Consuming an existing Guile library
   (guile-cbor for wire frames) is fine; writing Guile code that
   reimplements anything a Node package already does is the banned port,
   even for the engine's own storage. The membrane (WO-6) is therefore
   the first buildable qtOps order — the engine exists by articulating
   leaves, not by accreting local laws.
5. **metroplat adds the exchange protocols (A2A, ActivityPub, MCP) as one
   package over the node functions** — protocol faces never live inside or
   beside science/function packages.
6. **Primitives live once, on the registry, interdependent — never copied.**
   No vendored duplicates of primitives; interconnection through Verdaccio
   (`127.0.0.1:4873`) with exact pins.
7. **Guix is the dev/prod layer, run the way industry runs Nix**
   (owner-ruled, 2026-08-30). The mapping is exact: root `manifest.scm` is
   the dev shell (= `shell.nix` — `guix shell -m manifest.scm`);
   `src/guix-channels.scm` is the org-wide pin (= `flake.lock`, one per
   repo, like `.npmrc`), entered through `scripts/run-pinned-guix.sh`; the
   two-hop bootstrap hop (`guix-bootstrap-channels.scm`) is bare-cedar-fog's
   workaround for its old ambient Guix and lives in that host's section
   `src/`, not at root — host-specific files live in host custody; each
   directory that needs
   packaging carries its own `.scm` beside its content (= per-project
   `default.nix`; live example: koios-news/koios-news.scm, loadable with
   `-f`, module named by its repository path for `-L` at repo root); prod
   images come from the Guix closure (`guix pack -f docker`), never a
   second build authority. Guix packages toolchains, runtimes, machines,
   and content — it has the breadth npm lacks (note collections and
   glossaries are packageable) — while Node/npm custody stays on
   Verdaccio. NEVER write a `.scm` that performatively wraps or re-exports
   Node packages (owner-ruled 2026-08-30): a package definition exists
   only when something real is built, pinned, or deployed through it.
   Never a sidecar `guix/` application or a second hierarchy mirroring
   the tree; repo root carries exactly one environment entry file.
8. **Data custody (owner-ruled, 2026-08-30): a service section holds
   `data/` only when it is run as the root point of a FAE** (glossary:
   modeled-union-dimension — a Union territory operated through a
   conformant simulation engine). Leaf services do not journal locally.
   All working-with-data code lives once in the computer-data custody
   (`computer-data-engineering-services-section` and its serialization/cryptography/
   comparison/type/model/structure sub-sections, published as
   `@red-cup-engineering/computer-data-*`); every other section —
   including sections downstream of computer-data — consumes and
   parameterizes those packages, never hand-rolls its own journal,
   record, or store writers. On `bare-cedar-fog` specifically: no
   production system is meant to run on this box, so accumulated `data/`
   exhaust from services that are not live FAE roots is deletion
   inventory, not state to migrate.

## Public properties are parameterizations (owner-ruled 2026-08-30)

A public property (a channel, a subject site, a portfolio page) is JSON
parameters over shared upstream engineering services — never a bespoke
daemon per property. The emsWeb fleet (per-subject portfolio-status,
curriculum-delivery, notebook-exchange units) is the documented wrong
shape: its capabilities consolidate into engineering-owned services
(deployed as public-web when productized), each property reduced to the
JSON that calls them. Primitives live once; products are data.

## EAVT custody (owner-ruled 2026-08-30)

Plain EAVT gets its own topic section in engineering under computer-data
custody (the section-shape applies in full). **SEAVT sits downstream of
it in the semiotic lineage** (witness-journal/semiotic custody), defined
as: EAVT where each e, a, and v is meant to be RMN. Which lane code uses
depends on what it is doing — generic rows take EAVT; semantically
typed claims take SEAVT. Neither lane is a deprecation of the other.

**Owner-recognized 2026-08-30: this realizes RMN's original vision** —
"a way to sketch the obsmetrologic proof path of an action, hashing the
apex for brevity and security." A row is one step of the sketch; a
trace is the proof path — and per glass-sponge §11 the PATH is
first-class evidence: the endpoint digest does not determine the
factorization, and converging paths stay separately addressable. The
constitute law's kind:ni address is the SKETCH-LANE identity; the full
semantic law (§9 semanticSpicule) hashes a typed envelope naming
normalization and settlement profiles, because hashing does not create
the least fixed point — settlement earns the object first. Term
normalization and evidential settlement are two relations with no
proven commuting square: hold that ⊤, never fuse them. A vocabulary of
attributes, never an object format, is how an action-kind is said.
EAVT is the sketch lane; SEAVT is the same path written in typed RMN.
Rows are LEVEL 0 of the braided tower (April ruling,
dont-flatten-the-tower + pws-core-systems-design, 561-group notes
2026/04): asserted / saturated (Fix σ, the past-stable) / settled
(H* = Fix σ ∩ Fix Δ) are different strata and must never be stored
indistinguishably; σ and Δ are separate nuclei, never one lumped fold;
served surfaces are level-3 global sections. The four CHL columns are
the four causal positions of an utterance — σ the past cone, Δ the
future cone, FOUR forced by the quartet submonoid; the CHL-column
identification is the architectural commitment, and its proof is open
(three requirements unproved, per the dedicated carrier
research-curry-howard-lambek-quartet.md in relationality triage). eavt
(0.5.0) realizes this: saturate/transfer/stratify give Fix σ, Fix Δ,
and H* = Fix σ ∩ Fix Δ as separate derived passes over a trace, never a
stored field. Standard data formats for tasks/projects/
everything are therefore vocabularies over the row — entities born by a
constituting utterance and named by its digest — never per-kind object
schemas.

## Standing distinctions (do not flatten)

- **FAE is the engine; FARS is the system realized by the engine** (FAE = Flatfile Agent Engine, per the owning section README and the 2026-08-27 frog-and-fern naming note; a "FARE" typo calcified here as apparent law until 2026-09-01). The
  corpus is full of engine/system, carrier/referent, app/section pairs like
  this — names that look like synonyms are usually a distinction the theory
  depends on. When unsure, grep the glossary before treating two names as
  one thing.
- **The many engines are wanted** (TAB lineage, FeltOS, Horsetail, the
  games, qtOps...). What must be singular is each primitive, not the worlds
  built on them.
- **Legacy (`lib/legacy/`) is revival inventory, not a graveyard.** Legacy
  code is meant to be revived onto the current stack. Never unwire
  something merely because only legacy depends on it — migrate its
  consumers to the current primitive, then unwire.

## Schema handling

The org already has its schema system — never build another. Per-schema
wrapper packages with handrolled validators and byte-copies of schema
files in consuming leaves are both the disease. A record schema kept as
data lives once in its owning section's `data/records/schema/`.

## The five-custody thread (owner-stated 2026-09-01)

A capability is complete only when it threads all five top custodies:
**science** (the study of the thing, upstream of everything),
**engineering** (the code that computes it), **operations** (how it is
run), **561-group** (our actual running of it), **public** (the face the
world sees). **The 561-group section of a topic owns the other four
(owner-stated 2026-09-04):** `561-group-X-services-section` manages
`X-science`, `X-engineering`, `X-operations`, and `public-X` services
sections; it is the running of those four, so a roster of the Group's X
operations is a roster of what those four sections hold and how the Group
runs them. Live example: `561-group-economic-operations-services-section`
(and its nested business and finance sections) owns the economics,
business, and finance sciences, the economic, business, and financial
systems engineering sections, the operations custody's economic, business,
and finance operations sections, and the public economic, business, and
financial faces. An enterprise section landing in one custody alone is a
fragment; its unnamed thread-mates are debts, named in its founding
carrier. And sections must be ENTANGLED with the upstream codebase
(owner-ruled same day: "too thin and too independent" is the failure) —
a new section that consumes none of the house's published primitives
(metrologic, eavt, the journal services, the language/image/inference
teams) and cites no science carrier as its theory base is an island, the
inverse of the grab-bag disease and just as banned. The dialectic: not
monoliths, not islands — entangled organs, each thin in scope but thick
in connections.

**The direction of the thread, and what each custody trades (owner-stated
2026-09-06; record `561-group-services-section/data/records/2026-09-06-founder-utterances-on-specification-and-typed-resources.jsonl`,
explanation `561-group-services-section/content/text/documents/articles/teaching-articles/explanations/making-and-running-services-sections.md`):**
"561-Group-X-Services-Section gets contracted (as a rendanheyi micro-enterprise)
by X-Science, X-Engineering, X-Operations, and Public-X Service Sections, to
provide the capabilities of a 561 Group Services Section that itself brokers
knowledge between the other X's." And: "the 561-group's services section should
be then about making and running service sections that make and run service
sections." What each trades, verbatim: "Science fabricates and trades knowledge
of the theory of the thing and its like, secondary intension"; "Engineering
fabricates and trades the technology for realizing the defined token into
various domains, mostly computer for now"; "Operations fabricates and trades
knowledge of the theory of the practice of the thing." Public is a contracting
party whose trade the owner has not stated. Specifications, and every other
carrier, are resources typed down one chain ("specifications are one type of
article, being one type of document, being one type of text, being one type of
data") and are fabricated from journals by an engineering seat's operators, never
handwritten (ruling `2026-09-06-ruling-specifications-are-fabricated-from-journals-never-handwritten.json`).

## Standards-first data, networking, and deployment (owner-ruled 2026-09-04)

Owner verbatim intent: computer-code uses the same computer-data and
computer-networking standards, and computer-systems uses all of it; the
core data the org cares about (entities, resources, accounts, ledgers)
moves to standard schemas so the 561 Group keeps coherent ledgers and
accounts; deployment and production move to standard GitHub (Actions),
Guile/Guix, and Docker. Ranked: (1) MAIN — standard data formats and
network protocols under the agentic orchestration, so orchestration has
standard data to work over; (2) SECONDARY — recursively self-improving
enterprise agentic orchestration realizing the house theory (inquiry →
derivation → procedure → process; question → spec → test → code;
runbooks; parameterization over bespoke code; standardized programming
paradigms) toward the agentic ERP/ICS at ops.561.group, with cost
optimization and capability and profit expansion; (3) SIDE — meet-then-beat
Beancount's Fava as a MetroPlat surface on ops.561.group over token flows,
skill calls, tool uses, and the org's real finances, denominated where
possible in WITs, ACKs, and ATTs. The side quest serves the secondary by
supplying the ledger and account schemas the orchestration reads. Prefer an
existing open standard (JSON Schema, JSON-LD, CloudEvents, CBOR/JCS, ni:,
ActivityPub, A2A, MCP, OAuth, plain-text double-entry accounting) over a
house format every time one fits; a house format is justified only by a
cited theorem the standard cannot carry.
