import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";

const IGNORED_DIRECTORIES = new Set([".git", ".hg", ".svn", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", ".mypy_cache", "dist", "build", "coverage"]);
const TEXT_EXTENSIONS = new Set([".c", ".cc", ".cpp", ".cs", ".css", ".go", ".h", ".hpp", ".html", ".java", ".js", ".json", ".jsonl", ".jsx", ".md", ".mjs", ".org", ".py", ".rb", ".rs", ".rst", ".sh", ".sql", ".tex", ".toml", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
const CODE_EXTENSIONS = new Set([".c", ".cc", ".cpp", ".cs", ".go", ".h", ".hpp", ".java", ".js", ".jsx", ".mjs", ".py", ".rb", ".rs", ".sh", ".ts", ".tsx"]);
const MARKDOWN_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-data-engineering-services-section/services/computer-content-engineering-services-section/services/typed-computer-content-engineering-services-section/services/computer-text-data-services-section/services/markdown-engineering-services-section";
const SIGNCELL_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-data-engineering-services-section/src/signcell";
const DATA_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-data-engineering-services-section";
const GIT_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-code-engineering-services-section/services/computer-code-development-services-section/services/version-control-services-section/services/git-services-section";
const NETWORKING_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-networking-engineering-services-section";
const PUBLISHING_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-systems-engineering-services-section/services/computer-systems-publishing-engineering-services-section";
const CODE_DEVELOPMENT_HOME = "lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-code-engineering-services-section/services/computer-code-development-services-section";
const SCIENCE_HOME = "lib/emsenn/services/561-group/services/science-services-section";
const OPERATIONS_HOME = "lib/emsenn/services/561-group/services/operations-services-section";

const slash = (value) => value.split(sep).join("/");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const freeze = (value) => Object.freeze(value);
const unique = (values) => freeze([...new Set(values)]);
const extensionOf = (path) => {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
};
const textOf = (path) => TEXT_EXTENSIONS.has(extensionOf(path)) ? readFileSync(path, "utf8") : null;
const stable = (value) => JSON.stringify(value, null, 2) + "\n";
const under = (path, root) => path === root || path.startsWith(`${root}${sep}`);

function walk(root) {
  const files = [];
  const excluded = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) {
        excluded.push(freeze({ path: slash(relative(root, path)), reason: "symbolic-link-not-followed" }));
      } else if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) excluded.push(freeze({ path: slash(relative(root, path)), reason: `ignored-directory:${entry.name}` }));
        else visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      } else {
        excluded.push(freeze({ path: slash(relative(root, path)), reason: "non-regular-file" }));
      }
    }
  };
  visit(root);
  return freeze({ files: freeze(files), excluded: freeze(excluded) });
}

function symbols(text, extension) {
  if (text === null) return freeze([]);
  const found = [];
  const pattern = extension === ".py"
    ? /^\s*(?:async\s+def|def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/gmu
    : /^(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gmu;
  for (const match of text.matchAll(pattern)) found.push(match[1]);
  return freeze([...new Set(found)].sort((left, right) => left.localeCompare(right)));
}

function imports(text, extension) {
  if (text === null) return freeze([]);
  const patterns = extension === ".py"
    ? [/^\s*from\s+([^\s]+)\s+import\s+/gmu, /^\s*import\s+([^\s,]+)/gmu]
    : [/\bimport\s+(?:[^'";]+?\s+from\s+)?["']([^"']+)["']/gmu, /\brequire\s*\(\s*["']([^"']+)["']\s*\)/gmu];
  const found = [];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) found.push(match[1]);
  return freeze([...new Set(found)].sort((left, right) => left.localeCompare(right)));
}

function signals(path, text) {
  const subject = `${path}\n${text ?? ""}`.toLowerCase();
  const found = [];
  const detect = (id, expression) => { if (expression.test(subject)) found.push(id); };
  detect("markdown", /markdown|\.md\b|frontmatter|wikilink|pandoc/iu);
  detect("signcell", /signcell|sign cell|predication|eavt|semantic cell/iu);
  detect("git", /\bgit\b|commit_hash|commit hash|branch|rev-list|diff-tree/iu);
  detect("database", /sqlite|sqlalchemy|\bsql\b|database|\.db\b/iu);
  detect("network", /fastapi|flask|uvicorn|\bhttp\b|\bapi\b|route\(/iu);
  detect("publication", /publish|render|\bpdf\b|\bhtml\b|pandoc/iu);
  detect("orchestration", /runbook|workflow|pipeline|changelog|todo/iu);
  detect("research", /axiom|theor|relationing|mathematics|science|philosophy/iu);
  detect("cli", /argparse|click\b|__main__|process\.argv|commander/iu);
  return unique(found);
}

function candidateHomes(recordSignals, extension) {
  const homes = [];
  const add = (destination, reason, dependencies = []) => homes.push(freeze({ destination, reason, dependencies: freeze(dependencies) }));
  if (extension === ".md" || recordSignals.includes("markdown")) add(MARKDOWN_HOME, "Markdown syntax and evidence are carried by canonical Markdown data services downstream of SignCell.", [SIGNCELL_HOME]);
  if (recordSignals.includes("git")) add(GIT_HOME, "Git observations belong to version-control services.");
  if (recordSignals.includes("database")) add(DATA_HOME, "Derived indices are data materializations rather than application authorities.");
  if (recordSignals.includes("network")) add(NETWORKING_HOME, "Transport follows admitted carrier data.");
  if (recordSignals.includes("publication")) add(PUBLISHING_HOME, "Audience-facing release assembly belongs to publishing systems.");
  if (recordSignals.includes("orchestration")) add(OPERATIONS_HOME, "Named multi-step execution belongs to operations.");
  if (recordSignals.includes("research") && extension === ".md") add(SCIENCE_HOME, "Scientific subject ownership is separate from the upstream Markdown carrier.", [MARKDOWN_HOME]);
  if (homes.length === 0 || recordSignals.includes("cli")) add(CODE_DEVELOPMENT_HOME, "Executable adapters belong to code development until a lower carrier is established.");
  return freeze([...new Map(homes.map((home) => [home.destination, home])).values()]);
}

function recordFor(root, file) {
  const relativePath = slash(relative(root, file));
  const extension = extensionOf(relativePath);
  const bytes = readFileSync(file);
  const text = textOf(file);
  const recordSignals = signals(relativePath, text);
  return freeze({
    id: `legacy-source:${relativePath}:${hash(bytes).slice(0, 16)}`,
    source: freeze({ path: relativePath, sha256: hash(bytes), bytes: bytes.byteLength, extension, kind: CODE_EXTENSIONS.has(extension) ? "code-module" : text === null ? "binary-carrier" : "text-carrier" }),
    exports: symbols(text, extension),
    imports: imports(text, extension),
    signals: recordSignals,
    candidateHomes: candidateHomes(recordSignals, extension)
  });
}

/** Inventory every regular source carrier beneath a legacy root. Nothing is silently counted as migrated. */
export function inventoryLegacyCapabilities({ legacyRoot, repositoryRoot = process.cwd() } = {}) {
  if (typeof legacyRoot !== "string" || legacyRoot.trim() === "") throw new TypeError("legacyRoot must be a non-empty path");
  const root = resolve(legacyRoot);
  if (!existsSync(root) || !lstatSync(root).isDirectory()) throw new TypeError(`legacyRoot is not a directory: ${root}`);
  const repository = resolve(repositoryRoot);
  const walked = walk(root);
  const records = freeze(walked.files.map((file) => recordFor(root, file)));
  return freeze({
    kind: "legacy-capability-reallocation-ledger/v3",
    repositoryRoot: slash(repository),
    legacyRoot: slash(relative(repository, root)),
    inventory: freeze({ sourceFiles: records.length, excluded: walked.excluded }),
    records,
    capabilities: freeze([])
  });
}

const ARCHIVE_NAMES = new Set(["archive", "_archive"]);

/** The legacy root a path's segments lie in: the directory just below their nearest `lib/legacy`,
 *  as a ledger's `legacyRoot` names it, or null outside every legacy root. */
function legacyRootOf(segments) {
  for (let index = segments.length - 2; index >= 1; index -= 1) {
    if (segments[index - 1] === "lib" && segments[index] === "legacy") return segments.slice(0, index + 2).join("/");
  }
  return null;
}

/**
 * Read the directories named exactly `archive` or `_archive` among repository-relative file paths,
 * as a tracked listing gives them: each with the nearest archive enclosing it and the legacy root
 * holding it. An archive outside every legacy root is legacy material no ledger can inventory
 * until it is placed under one.
 */
export function readArchiveDirectories(paths) {
  const directories = new Set();
  for (const file of paths) {
    const segments = file.split("/");
    for (let index = 0; index < segments.length - 1; index += 1) {
      if (ARCHIVE_NAMES.has(segments[index])) directories.add(segments.slice(0, index + 1).join("/"));
    }
  }
  return freeze([...directories].sort((left, right) => left.localeCompare(right)).map((directory) => {
    const segments = directory.split("/");
    const enclosing = segments.slice(0, -1).findLastIndex((segment) => ARCHIVE_NAMES.has(segment));
    const legacyRoot = legacyRootOf(segments);
    return freeze({
      path: directory,
      name: segments.at(-1),
      nestedUnder: enclosing < 0 ? null : segments.slice(0, enclosing + 1).join("/"),
      legacyRoot,
      legacyState: legacyRoot === null ? "outside-legacy" : "inside-legacy",
    });
  }));
}

function readLedger(path) {
  const ledger = JSON.parse(readFileSync(path, "utf8"));
  if (ledger?.kind !== "legacy-capability-reallocation-ledger/v3" || !Array.isArray(ledger.records) || !Array.isArray(ledger.capabilities) || typeof ledger.legacyRoot !== "string") throw new TypeError("ledger is not a legacy-capability-reallocation-ledger/v3 carrier");
  return ledger;
}

const states = new Set(["unallocated", "allocated", "implemented", "retired"]);
function evidenceFailures(capability, repository) {
  const label = capability.id;
  const allocation = capability.allocation;
  if (!allocation || !states.has(allocation.state)) return [`${label}: allocation.state is missing or invalid`];
  if (allocation.state !== "retired") return [`${label}: allocation is ${allocation.state}`];
  if (typeof allocation.destination !== "string" || allocation.destination.length === 0) return [`${label}: retired allocation has no destination`];
  const destination = resolve(repository, allocation.destination);
  if (!existsSync(destination)) return [`${label}: destination does not exist: ${allocation.destination}`];
  if (!Array.isArray(allocation.modernEvidence) || allocation.modernEvidence.length === 0) return [`${label}: retired allocation has no modern evidence`];
  const failures = [];
  for (const evidence of allocation.modernEvidence) {
    if (!evidence || typeof evidence.path !== "string" || typeof evidence.effect !== "string" || evidence.effect.trim() === "") {
      failures.push(`${label}: modern evidence requires path and effect`);
      continue;
    }
    const path = resolve(repository, evidence.path);
    if (!existsSync(path)) failures.push(`${label}: modern evidence is missing: ${evidence.path}`);
    else if (slash(relative(repository, path)).includes("/lib/legacy/")) failures.push(`${label}: modern evidence points back into legacy: ${evidence.path}`);
  }
  return failures;
}

function modernReferences(repository, legacyRoot, allowed = new Set()) {
  const references = [];
  const walked = walk(repository);
  const rootRelative = slash(relative(repository, legacyRoot));
  for (const file of walked.files) {
    if (under(file, legacyRoot) || allowed.has(file) || !CODE_EXTENSIONS.has(extensionOf(file))) continue;
    const text = textOf(file);
    if (text.includes(rootRelative)) references.push(slash(relative(repository, file)));
  }
  return freeze(references);
}

function declaredMaterializations(capability, records = []) {
  const direct = Array.isArray(capability?.allocation?.materializations) ? capability.allocation.materializations : [];
  const roots = Array.isArray(capability?.allocation?.materializationRoots) ? capability.allocation.materializationRoots : [];
  const sourceRecords = Array.isArray(records) ? records : [...records.values()];
  const admittedSources = new Set(capability?.sourcePaths ?? []);
  const expanded = roots.flatMap(({ sourcePrefix, destinationPrefix }) => sourceRecords
    .filter((record) => admittedSources.has(record.source.path) && record.source.path.startsWith(`${sourcePrefix}/`))
    .map((record) => freeze({ sourcePath: record.source.path, destinationPath: `${destinationPrefix}/${record.source.path.slice(sourcePrefix.length + 1)}` })));
  return [...direct, ...expanded];
}

const gitText = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] });

/**
 * Where a path held these bytes in the history of the repository that tracks it (a mounted owner included):
 * the commit that wrote them there and their blob, or null when there is no history or never those bytes.
 */
function bytesInPathHistory(cwd, path, sha256) {
  let log;
  try { log = gitText(cwd, ["log", "--format=commit %H", "--raw", "--no-abbrev", "--", path]); } catch { return null; }
  let commit = null;
  const written = [];
  for (const line of log.split("\n")) {
    if (line.startsWith("commit ")) { commit = line.slice(7); continue; }
    const blob = /^:\d+ \d+ [0-9a-f]+ ([0-9a-f]+) /u.exec(line)?.[1];
    if (blob && !/^0+$/u.test(blob)) written.push({ commit, blob });
  }
  const seen = new Map();
  for (const { commit: at, blob } of written.reverse()) {
    if (!seen.has(blob)) {
      try { seen.set(blob, hash(execFileSync("git", ["-C", cwd, "cat-file", "blob", blob], { maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] })) === sha256); }
      catch { seen.set(blob, false); /* a blob outside a shallow history is no evidence */ }
    }
    if (seen.get(blob)) return freeze({ commit: at, blob });
  }
  return null;
}

/** The first commit that wrote a path, and the blob it wrote there, or null without history. */
function firstWriteOfPath(cwd, path) {
  try {
    const commit = gitText(cwd, ["log", "--reverse", "--format=%H", "--", path]).split("\n")[0];
    return commit ? freeze({ commit, blob: gitText(cwd, ["rev-parse", `${commit}:./${path}`]).trim() }) : null;
  } catch { return null; }
}

/** Whether `later` revises after `earlier`: its descendant in one repository, else committed after it. */
function revisesAfter(earlierCwd, earlier, laterCwd, later) {
  try {
    if (gitText(earlierCwd, ["rev-parse", "--show-toplevel"]) === gitText(laterCwd, ["rev-parse", "--show-toplevel"])) {
      execFileSync("git", ["-C", laterCwd, "merge-base", "--is-ancestor", earlier, later], { stdio: "ignore" });
      return true;
    }
    return Number(gitText(laterCwd, ["log", "-1", "--format=%ct", later])) > Number(gitText(earlierCwd, ["log", "-1", "--format=%ct", earlier]));
  } catch { return false; }
}

/**
 * A materialized carrier reads `identical` when it still holds the archived bytes, and `revised` when it was
 * provably materialized (those bytes are in the path's own history) and has since been revised in place:
 * a carrier is materialized to live on, not to be frozen. It is `revised` in transit when it was edited as it
 * was carried: the archive held those bytes at the ledger's own source path, and the carrier's first commit
 * came after. Anything else is a failure.
 */
function materializationReading(materialization, record, repository, legacyRoot, label) {
  const failed = (failure) => ({ failure, reading: null });
  if (!materialization || typeof materialization.sourcePath !== "string" || typeof materialization.destinationPath !== "string") {
    return failed(`${label}: materialization requires sourcePath and destinationPath`);
  }
  if (materialization.sourcePath !== record.source.path) return failed(`${label}: materialization names a source outside this capability: ${materialization.sourcePath}`);
  const destination = resolve(repository, materialization.destinationPath);
  if (!under(destination, repository) || under(destination, legacyRoot)) return failed(`${label}: materialization destination must be a non-legacy repository path: ${materialization.destinationPath}`);
  if (!existsSync(destination)) return failed(`${label}: materialized carrier is missing: ${materialization.destinationPath}`);
  if (!lstatSync(destination).isFile()) return failed(`${label}: materialized carrier is not a regular file: ${materialization.destinationPath}`);
  if (hash(readFileSync(destination)) === record.source.sha256) return { failure: null, reading: freeze({ capability: label, destinationPath: materialization.destinationPath, reading: "identical" }) };
  const here = dirname(destination);
  const atDestination = bytesInPathHistory(here, basename(destination), record.source.sha256);
  if (atDestination) return { failure: null, reading: freeze({ capability: label, destinationPath: materialization.destinationPath, reading: "revised", materializedAt: atDestination.blob }) };
  const archived = bytesInPathHistory(repository, slash(relative(repository, resolve(legacyRoot, record.source.path))), record.source.sha256);
  const first = archived && firstWriteOfPath(here, basename(destination));
  if (!first || !revisesAfter(repository, archived.commit, here, first.commit)) {
    return failed(`${label}: materialized carrier content differs from archived source, and neither its path nor the archive's source path ever held it before the carrier: ${materialization.destinationPath}`);
  }
  return { failure: null, reading: freeze({ capability: label, destinationPath: materialization.destinationPath, reading: "revised", inTransit: true, archivedAt: archived.commit, materializedIn: first.commit, materializedAt: first.blob }) };
}

function rehomedRecord(record, capabilities, repository, legacyRoot) {
  const witnesses = capabilities.flatMap((capability) => capability.allocation?.state === "retired"
    ? declaredMaterializations(capability, [record]).map((materialization) => ({ capability, materialization }))
    : []).filter(({ materialization }) => materialization?.sourcePath === record.source.path);
  if (witnesses.length !== 1) return { rehomed: false, failures: witnesses.length > 1 ? [`${record.source.path}: source has multiple materialization declarations`] : [] };
  const { capability, materialization } = witnesses[0];
  const { failure } = materializationReading(materialization, record, repository, legacyRoot, capability.id);
  return failure ? { rehomed: false, failures: [failure] } : { rehomed: true, failures: [] };
}

/** Verify source closure, modern witnesses, and retirement before allowing a completion claim. */
export function verifyLegacyCapabilityReallocation({ ledgerPath, repositoryRoot = process.cwd() } = {}) {
  if (typeof ledgerPath !== "string" || ledgerPath.trim() === "") throw new TypeError("ledgerPath must be a non-empty path");
  const repository = resolve(repositoryRoot);
  const ledger = readLedger(ledgerPath);
  const legacyRoot = resolve(repository, ledger.legacyRoot);
  const archivePurged = ledger.archiveDisposition === "purged";
  if (!existsSync(legacyRoot) && !archivePurged) throw new TypeError(`legacyRoot is unavailable without an explicit purged archive disposition: ${ledger.legacyRoot}`);
  const current = existsSync(legacyRoot)
    ? inventoryLegacyCapabilities({ legacyRoot, repositoryRoot: repository })
    : freeze({ records: freeze([]) });
  const claimed = new Map(ledger.records.map((record) => [record.source.path, record]));
  const failures = [];
  for (const record of current.records) {
    const prior = claimed.get(record.source.path);
    if (!prior) failures.push(`${record.source.path}: discovered source is absent from the ledger`);
    else if (prior.source.sha256 !== record.source.sha256) failures.push(`${record.source.path}: source changed after ledger inventory`);
  }
  const knownSources = new Set(ledger.records.map((record) => record.source.path));
  const currentSources = new Set(current.records.map((record) => record.source.path));
  const capabilities = ledger.capabilities;
  const intentionallyPurged = [];
  for (const record of ledger.records) {
    if (!currentSources.has(record.source.path)) {
      const witness = rehomedRecord(record, capabilities, repository, legacyRoot);
      failures.push(...witness.failures);
      if (!witness.rehomed) {
        if (archivePurged) intentionallyPurged.push(record);
        else failures.push(`${record.source.path}: ledger source no longer exists beneath the legacy root without a verified materialization`);
      }
    }
  }
  const covered = new Set();
  const ids = new Set();
  const materializations = [];
  for (const capability of capabilities) {
    if (!capability || typeof capability.id !== "string" || capability.id.length === 0 || ids.has(capability.id)) failures.push("capability declaration has a missing or duplicate id");
    else ids.add(capability.id);
    if (typeof capability?.effect !== "string" || capability.effect.trim() === "") failures.push(`${capability?.id ?? "capability"}: effect is required`);
    if (typeof capability?.carrier !== "string" || capability.carrier.trim() === "") failures.push(`${capability?.id ?? "capability"}: carrier is required`);
    if (!Array.isArray(capability?.sourcePaths) || capability.sourcePaths.length === 0) failures.push(`${capability?.id ?? "capability"}: sourcePaths is required`);
    else for (const sourcePath of capability.sourcePaths) {
      if (!knownSources.has(sourcePath)) failures.push(`${capability.id}: names undiscovered source ${sourcePath}`);
      else covered.add(sourcePath);
    }
    for (const materialization of declaredMaterializations(capability, ledger.records)) {
      const record = claimed.get(materialization?.sourcePath);
      if (!record) failures.push(`${capability.id}: materialization names undiscovered source ${materialization?.sourcePath ?? ""}`);
      else {
        const { failure, reading } = materializationReading(materialization, record, repository, legacyRoot, capability.id);
        if (failure) failures.push(failure);
        else materializations.push(reading);
      }
    }
    failures.push(...evidenceFailures(capability, repository));
  }
  for (const sourcePath of knownSources) if (!covered.has(sourcePath)) failures.push(`${sourcePath}: no explicit capability declaration covers this source evidence`);
  for (const record of intentionallyPurged) {
    const owners = capabilities.filter((capability) => capability.sourcePaths.includes(record.source.path));
    if (owners.length === 0 || owners.some((capability) => capability.allocation?.state !== "retired")) {
      failures.push(`${record.source.path}: purged source lacks a fully retired capability declaration`);
    }
  }
  const references = modernReferences(repository, legacyRoot, new Set([resolve(ledgerPath)]));
  if (references.length) failures.push(...references.map((path) => `${path}: non-legacy source still references ${ledger.legacyRoot}`));
  const retired = capabilities.filter((capability) => capability.allocation?.state === "retired").length;
  return freeze({
    kind: "legacy-capability-reallocation-verification/v1",
    ledger: slash(relative(repository, resolve(ledgerPath))),
    legacyRoot: ledger.legacyRoot,
    sourceFiles: current.records.length,
    capabilities: capabilities.length,
    retired,
    materializations: freeze(materializations),
    status: failures.length === 0 && retired === capabilities.length ? "fully-reallocated" : "incomplete",
    ok: failures.length === 0 && retired === capabilities.length,
    failures: freeze(failures)
  });
}

/** Purge an archived source directory only after the current ledger verifies complete reallocation. */
export function purgeLegacyCapabilityArchive({ ledgerPath, repositoryRoot = process.cwd() } = {}) {
  if (typeof ledgerPath !== "string" || ledgerPath.trim() === "") throw new TypeError("ledgerPath must be a non-empty path");
  const repository = resolve(repositoryRoot);
  const preflight = verifyLegacyCapabilityReallocation({ ledgerPath, repositoryRoot: repository });
  if (!preflight.ok) throw new Error("legacy archive cannot be purged before full reallocation verification");
  const ledger = readLedger(ledgerPath);
  const archive = resolve(repository, ledger.legacyRoot);
  if (!existsSync(archive) || !lstatSync(archive).isDirectory()) throw new TypeError(`legacy archive is unavailable: ${ledger.legacyRoot}`);
  rmSync(archive, { recursive: true, force: false });
  const retired = { ...ledger, archiveDisposition: "purged" };
  writeFileSync(resolve(ledgerPath), stable(retired));
  return freeze({ legacyRoot: ledger.legacyRoot, archiveDisposition: "purged", status: "purged" });
}

/** Move declared evidence carriers out of an archive, refusing altered sources or ambiguous destinations. */
export function materializeLegacyCapabilityCarriers({ ledgerPath, repositoryRoot = process.cwd() } = {}) {
  if (typeof ledgerPath !== "string" || ledgerPath.trim() === "") throw new TypeError("ledgerPath must be a non-empty path");
  const repository = resolve(repositoryRoot);
  const ledger = readLedger(ledgerPath);
  const legacyRoot = resolve(repository, ledger.legacyRoot);
  const records = new Map(ledger.records.map((record) => [record.source.path, record]));
  const seenSources = new Set();
  const moved = [];
  for (const capability of ledger.capabilities) {
    if (capability.allocation?.state !== "retired") continue;
    for (const materialization of declaredMaterializations(capability, records)) {
      const record = records.get(materialization?.sourcePath);
      if (!record) throw new TypeError(`${capability.id} materializes an undiscovered source`);
      if (seenSources.has(record.source.path)) throw new TypeError(`${record.source.path} has multiple materialization declarations`);
      seenSources.add(record.source.path);
      const source = resolve(legacyRoot, materialization.sourcePath);
      const destination = resolve(repository, materialization.destinationPath);
      if (!under(source, legacyRoot) || !under(destination, repository) || under(destination, legacyRoot)) throw new TypeError(`${capability.id} has an out-of-scope materialization`);
      if (existsSync(destination)) {
        if (!lstatSync(destination).isFile() || hash(readFileSync(destination)) !== record.source.sha256) throw new TypeError(`${capability.id} destination conflicts with its archived carrier: ${materialization.destinationPath}`);
        if (existsSync(source)) {
          if (!lstatSync(source).isFile() || hash(readFileSync(source)) !== record.source.sha256) throw new TypeError(`${capability.id} source changed before materialization: ${materialization.sourcePath}`);
          throw new TypeError(`${capability.id} has both source and destination; resolve the duplicate explicitly`);
        }
        continue;
      }
      if (!existsSync(source) || !lstatSync(source).isFile()) throw new TypeError(`${capability.id} source is unavailable for materialization: ${materialization.sourcePath}`);
      if (hash(readFileSync(source)) !== record.source.sha256) throw new TypeError(`${capability.id} source changed before materialization: ${materialization.sourcePath}`);
      mkdirSync(dirname(destination), { recursive: true });
      renameSync(source, destination);
      moved.push(freeze({ sourcePath: materialization.sourcePath, destinationPath: materialization.destinationPath, capability: capability.id }));
    }
  }
  return freeze({ ledgerPath: resolve(ledgerPath), moved: freeze(moved), status: "materialized" });
}

export function writeLegacyCapabilityLedger({ legacyRoot, outputPath, repositoryRoot = process.cwd() } = {}) {
  if (typeof outputPath !== "string" || outputPath.trim() === "") throw new TypeError("outputPath must be a non-empty path");
  const report = inventoryLegacyCapabilities({ legacyRoot, repositoryRoot });
  const output = resolve(outputPath);
  writeFileSync(output, stable(report));
  return freeze({ outputPath: output, sourceFiles: report.inventory.sourceFiles, status: "unallocated" });
}

/** Apply capability-level allocations; declarations never invent source records or silently widen scope. */
export function applyLegacyCapabilityAllocations({ ledgerPath, declarationsPath } = {}) {
  if (typeof ledgerPath !== "string" || ledgerPath.trim() === "") throw new TypeError("ledgerPath must be a non-empty path");
  if (typeof declarationsPath !== "string" || declarationsPath.trim() === "") throw new TypeError("declarationsPath must be a non-empty path");
  const ledger = readLedger(ledgerPath);
  const declarations = JSON.parse(readFileSync(declarationsPath, "utf8"));
  if (declarations?.kind !== "legacy-capability-allocation-declarations/v1" || !Array.isArray(declarations.capabilities)) throw new TypeError("allocation declarations must be legacy-capability-allocation-declarations/v1");
  const declared = new Map();
  const knownSources = new Set(ledger.records.map((record) => record.source.path));
  for (const capability of declarations.capabilities) {
    if (!capability || typeof capability.id !== "string" || capability.id.length === 0) throw new TypeError("each capability declaration requires id");
    if (declared.has(capability.id)) throw new TypeError(`duplicate capability declaration: ${capability.id}`);
    if (!Array.isArray(capability.sourcePaths) || capability.sourcePaths.length === 0) throw new TypeError(`sourcePaths is required for ${capability.id}`);
    for (const sourcePath of capability.sourcePaths) if (!knownSources.has(sourcePath)) throw new TypeError(`${capability.id} names undiscovered source: ${sourcePath}`);
    if (typeof capability.effect !== "string" || capability.effect.trim() === "") throw new TypeError(`effect is required for ${capability.id}`);
    if (typeof capability.carrier !== "string" || capability.carrier.trim() === "") throw new TypeError(`carrier is required for ${capability.id}`);
    if (!states.has(capability.state)) throw new TypeError(`invalid allocation state for ${capability.id}`);
    if (typeof capability.destination !== "string" || capability.destination.length === 0) throw new TypeError(`allocation destination is required for ${capability.id}`);
    if (typeof capability.rationale !== "string" || capability.rationale.trim() === "") throw new TypeError(`allocation rationale is required for ${capability.id}`);
    if (capability.state === "retired" && (!Array.isArray(capability.modernEvidence) || capability.modernEvidence.length === 0)) throw new TypeError(`retired allocation requires modernEvidence: ${capability.id}`);
    if (capability.materializations !== undefined) {
      if (!Array.isArray(capability.materializations)) throw new TypeError(`materializations must be an array for ${capability.id}`);
      for (const materialization of capability.materializations) {
        if (!materialization || typeof materialization.sourcePath !== "string" || typeof materialization.destinationPath !== "string") throw new TypeError(`materializations require sourcePath and destinationPath for ${capability.id}`);
        if (!capability.sourcePaths.includes(materialization.sourcePath)) throw new TypeError(`${capability.id} materializes a source outside sourcePaths: ${materialization.sourcePath}`);
      }
    }
    if (capability.materializationRoots !== undefined) {
      if (!Array.isArray(capability.materializationRoots)) throw new TypeError(`materializationRoots must be an array for ${capability.id}`);
      for (const root of capability.materializationRoots) {
        if (!root || typeof root.sourcePrefix !== "string" || root.sourcePrefix.length === 0 || typeof root.destinationPrefix !== "string" || root.destinationPrefix.length === 0) throw new TypeError(`materializationRoots require sourcePrefix and destinationPrefix for ${capability.id}`);
        if (!capability.sourcePaths.some((sourcePath) => sourcePath.startsWith(`${root.sourcePrefix}/`))) throw new TypeError(`${capability.id} materializes an empty source root: ${root.sourcePrefix}`);
      }
    }
    declared.set(capability.id, capability);
  }
  const retained = ledger.capabilities.filter((capability) => !declared.has(capability.id));
  const applied = [...retained, ...declared.values()].map((capability) => ({
    id: capability.id,
    sourcePaths: capability.sourcePaths,
    effect: capability.effect,
    carrier: capability.carrier,
    allocation: {
      state: capability.state,
      destination: capability.destination,
      rationale: capability.rationale,
      ...(capability.modernEvidence === undefined ? {} : { modernEvidence: capability.modernEvidence }),
      ...(capability.materializations === undefined ? {} : { materializations: capability.materializations }),
      ...(capability.materializationRoots === undefined ? {} : { materializationRoots: capability.materializationRoots })
    }
  }));
  writeFileSync(ledgerPath, stable({ ...ledger, capabilities: applied }));
  return freeze({ ledgerPath: resolve(ledgerPath), applied: declared.size, retained: retained.length, sourceEvidence: knownSources.size });
}
