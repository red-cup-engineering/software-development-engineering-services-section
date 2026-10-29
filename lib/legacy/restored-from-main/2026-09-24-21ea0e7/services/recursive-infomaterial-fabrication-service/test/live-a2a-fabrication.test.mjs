import assert from "node:assert/strict"; import test from "node:test"; import { spawnSync } from "node:child_process"; import { readFileSync } from "node:fs"; import { mkdtemp, writeFile } from "node:fs/promises"; import { tmpdir } from "node:os"; import { createServer } from "node:net"; import { join, resolve } from "node:path"; import { fileURLToPath } from "node:url";
import { createA2aServer } from "@red-cup-engineering/a2a-services-section/a2a-server"; import { ephemeralAgentCardSigning } from "@red-cup-engineering/a2a-services-section/agent-card-signing"; import { observeInfomaterial } from "@lenticule-science/infomaterial-observation"; import { fabricateDirectoryPatch } from "@red-cup-engineering/recursive-infomaterial-fabrication-service";
const packageRoot = (specifier) => resolve(fileURLToPath(import.meta.resolve(specifier)), "../..");
const PLATE = packageRoot("@lenticule-science/infomaterial-directory-plate-observation"), OBSERVE = packageRoot("@lenticule-science/infomaterial-observation"), COVER = packageRoot("@lenticule-science/infomaterial-patch-cover"), EQUIVALENCE = packageRoot("@lenticule-science/hierarchical-circuit-equivalence-assay");
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
test("live official A2A fan-out and fan-in reconstructs the recursive material root", { skip: process.env.LIVE_A2A_FABRICATION === "1" ? false : "requires a live A2A network; set LIVE_A2A_FABRICATION=1" }, async () => {
  const territory = await mkdtemp(join(tmpdir(), "live-a2a-fabrication-")); await writeFile(join(territory, "alpha"), "alpha"); await writeFile(join(territory, "beta"), "beta");
  const priorTerritory = process.env.INFOMATERIAL_TERRITORY_ROOT, priorPlateTerritory = process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT; const running = [];
  try {
    process.env.INFOMATERIAL_TERRITORY_ROOT = territory; process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT = territory;
    const plate = await provider(PLATE, "directory-plate-observation.json", await freePort()), observe = await provider(OBSERVE, "infomaterial-observation.json", await freePort()), cover = await provider(COVER, "directory-patch-cover.json", await freePort()), equivalence = await provider(EQUIVALENCE, "hierarchical-circuit-equivalence-assay.json", await freePort()); running.push(plate, observe, cover, equivalence);
    const result = await fabricateDirectoryPatch({ equivalenceAgent: `${equivalence.baseUrl}/.well-known/agent-card.json`, synthesisAgent: process.env.SYNTHESIS_AGENT ?? "http://127.0.0.1:19824/.well-known/agent-card.json", plateAgent: `${plate.baseUrl}/.well-known/agent-card.json`, coverAgent: `${cover.baseUrl}/.well-known/agent-card.json`, plateRelativePath: ".", maximumMounts: 10, maximumParallel: 2, routes: [
      { mount: "alpha", providerAgent: `${observe.baseUrl}/.well-known/agent-card.json`, request: { kind: "InfomaterialObservationTask", relativePath: "alpha", maximumEntries: 10, maximumBytes: "1000" } },
      { mount: "beta", providerAgent: `${observe.baseUrl}/.well-known/agent-card.json`, request: { kind: "InfomaterialObservationTask", relativePath: "beta", maximumEntries: 10, maximumBytes: "1000" } },
    ] });
    const whole = await observeInfomaterial(territory); assert.equal(result.coverReceipt.materialRoot, whole.observation.materialRoot); assert.equal(result.receipt.children.length, 2); assert.equal(result.receipt.localMaterialRead, false);
  } finally {
    await Promise.all(running.reverse().map(({ server }) => new Promise((done) => server.close(done))));
    if (priorTerritory === undefined) delete process.env.INFOMATERIAL_TERRITORY_ROOT; else process.env.INFOMATERIAL_TERRITORY_ROOT = priorTerritory;
    if (priorPlateTerritory === undefined) delete process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT; else process.env.INFOMATERIAL_DIRECTORY_PLATE_TERRITORY_ROOT = priorPlateTerritory;
  }
});
