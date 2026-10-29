import assert from "node:assert/strict"; import test from "node:test"; import { spawnSync } from "node:child_process"; import { readFileSync } from "node:fs"; import { readdir } from "node:fs/promises"; import { tmpdir } from "node:os"; import { createServer } from "node:net"; import { join, resolve } from "node:path"; import { fileURLToPath } from "node:url";
import { createA2aServer } from "@red-cup-engineering/a2a-services-section/a2a-server"; import { ephemeralAgentCardSigning } from "@red-cup-engineering/a2a-services-section/agent-card-signing"; import { observeInfomaterial } from "@lenticule-science/infomaterial-observation"; import { fabricateDirectoryPatch } from "@red-cup-engineering/recursive-infomaterial-fabrication-service";
const packageRoot = (specifier) => resolve(fileURLToPath(import.meta.resolve(specifier)), "../..");
const PLATE = packageRoot("@lenticule-science/infomaterial-directory-plate-observation"), COVER = packageRoot("@lenticule-science/infomaterial-patch-cover"), EQUIVALENCE = packageRoot("@lenticule-science/hierarchical-circuit-equivalence-assay"), CONTRACTS = resolve(import.meta.dirname, "../../semiotic-computer-system-services-section/lib/legacy/2026-08-26-rmn-semantic-conformance-v4/content/contracts");
async function freePort() { const socket = createServer(); await new Promise((done) => socket.listen(0, "127.0.0.1", done)); const port = socket.address().port; await new Promise((done) => socket.close(done)); return port; }
// Replaces the retired a2a-contracted-agent-service's process-per-request serveContractedAgent
// with the current createA2aServer, wrapping the same execute-a2a-task.mjs stdin/stdout contract.
async function provider(root, card, port) {
  const baseUrl = `http://127.0.0.1:${port}`; const executorPath = join(root, "scripts/execute-a2a-task.mjs");
  const rawCard = JSON.parse(readFileSync(join(root, "content/agent-cards", card), "utf8"));
  const signing = ephemeralAgentCardSigning(baseUrl, `${card}-${port}`);
  return createA2aServer({ port, host: "127.0.0.1", baseUrl, agentCard: signing.sign(rawCard), handlers: { "message/send": (message) => {
    const result = spawnSync(process.execPath, [executorPath], { input: JSON.stringify(message), encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || `executor ${executorPath} exited ${result.status}`);
    return JSON.parse(result.stdout);
  } } });
}
test("bare-cedar-fog plate and cover compose child observations from cold-red-gate", { skip: process.env.CROSS_MACHINE_A2A_FABRICATION === "1" ? false : "requires a live cross-machine A2A network; set CROSS_MACHINE_A2A_FABRICATION=1" }, async () => {
  const remoteObserver = process.env.COLD_RED_GATE_OBSERVER_AGENT; if (!remoteObserver) throw new Error("COLD_RED_GATE_OBSERVER_AGENT is required");
  const priorTerritory = process.env.INFOMATERIAL_TERRITORY_ROOT, priorPlateTerritory = process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT, running = [];
  try {
    process.env.INFOMATERIAL_TERRITORY_ROOT = CONTRACTS; process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT = CONTRACTS;
    const plate = await provider(PLATE, "directory-plate-observation.json", await freePort()), cover = await provider(COVER, "directory-patch-cover.json", await freePort()), equivalence = await provider(EQUIVALENCE, "hierarchical-circuit-equivalence-assay.json", await freePort()); running.push(plate, cover, equivalence);
    const names = (await readdir(CONTRACTS, { withFileTypes: true })).map(({ name }) => name.normalize("NFC")).sort();
    const routes = names.map((name) => ({ mount: name, providerAgent: remoteObserver, request: { kind: "InfomaterialObservationTask", relativePath: name, maximumEntries: 100, maximumBytes: "1000000" } }));
    const result = await fabricateDirectoryPatch({ equivalenceAgent: `${equivalence.baseUrl}/.well-known/agent-card.json`, synthesisAgent: process.env.SYNTHESIS_AGENT ?? "http://127.0.0.1:19824/.well-known/agent-card.json", plateAgent: `${plate.baseUrl}/.well-known/agent-card.json`, coverAgent: `${cover.baseUrl}/.well-known/agent-card.json`, plateRelativePath: ".", maximumMounts: 100, maximumParallel: 4, routes });
    const local = await observeInfomaterial(CONTRACTS); assert.equal(result.coverReceipt.materialRoot, local.observation.materialRoot); assert.equal(result.receipt.children.length, names.length); assert.equal(new Set(result.receipt.children.map(({ providerAgent }) => providerAgent)).size, 1); assert.equal(result.receipt.localMaterialRead, false);
  } finally {
    await Promise.all(running.reverse().map(({ server }) => new Promise((done) => server.close(done)))); if (priorTerritory === undefined) delete process.env.INFOMATERIAL_TERRITORY_ROOT; else process.env.INFOMATERIAL_TERRITORY_ROOT = priorTerritory; if (priorPlateTerritory === undefined) delete process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT; else process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT = priorPlateTerritory;
  }
});
