#!/usr/bin/env node
import { runJavascriptNodeOperation } from "../../../../javascript-engineering-services-section/services/javascript-node-services-section/src/operation.mjs";
const freeze = (value) => Object.freeze(value);
const list = (value) => Array.isArray(value) ? value : [];
const text = (value) => typeof value === "string" && value.trim() !== "" ? value.trim() : null;

export function projectOperationalHeartbeat(carriers, params = {}, options = {}) {
  const generatedAt = options.generatedAt ?? params.generatedAt ?? new Date().toISOString();
  const goals = list(carriers.goals?.goals);
  const work = list(carriers.work?.work ?? carriers.work?.items);
  const operations = list(carriers.operations?.entries);
  const enactments = list(carriers.orchestration?.prioritizedEnactments ?? carriers.orchestration?.enactments);
  const openGoals = goals.filter((item) => !["complete", "completed", "closed"].includes(item.status));
  const activeWork = work.filter((item) => !["complete", "completed", "closed"].includes(item.status));
  const blockedWork = activeWork.filter((item) => item.status === "blocked" || list(item.blockers).length > 0);
  const pressures = freeze([
    blockedWork.length > 0 && pressure("blocked-work", 100, `${blockedWork.length} work item(s) are blocked`, "settle or reroute the blocking dependency"),
    openGoals.length > 0 && activeWork.length === 0 && pressure("unrealized-goal", 80, `${openGoals.length} open goal(s) have no active work`, "admit a concrete work transition"),
    activeWork.length > 8 && pressure("work-in-progress", 60, `${activeWork.length} work items are active`, "finish or suspend work before admitting more"),
    enactments[0] && pressure("orchestration-front", 40, enactments[0].summary ?? enactments[0].title ?? "an enactment is ready", "enter the prioritized enactment"),
  ].filter(Boolean));
  const focus = text(params.focus) ?? text(params.intent);
  const nextWork = freeze([
    ...blockedWork.map((item) => workView(item, "unblock")),
    ...activeWork.filter((item) => !blockedWork.includes(item)).map((item) => workView(item, "continue")),
    ...enactments.map((item) => freeze({ id: item.id ?? "orchestration-next", title: item.title ?? item.summary ?? "Enact orchestration front", action: "enact", source: "orchestration" })),
  ].slice(0, Number(params.limit ?? 12)));
  const context = carriers.context?.suit ?? carriers.context ?? null;
  return freeze({
    kind: "operational-heartbeat",
    generatedAt,
    focus,
    summary: `${openGoals.length} open goal(s); ${activeWork.length} active work item(s); ${blockedWork.length} blocked; ${operations.length} operation witness(es)`,
    counts: freeze({ goals: goals.length, openGoals: openGoals.length, work: work.length, activeWork: activeWork.length, blockedWork: blockedWork.length, operations: operations.length, enactments: enactments.length }),
    pressures,
    nextWork,
    spacesuit: freeze({ focus, admission: context?.admission?.id ?? null, omissions: list(context?.omissions), interfaces: list(context?.interfaces ?? context?.nextInterfaces) }),
    nextInterfaces: freeze([
      freeze({ bin: "read-work-items", purpose: "inspect the complete work carrier", params: freeze({ detail: "full" }) }),
      freeze({ bin: "select-work-interface", purpose: "enter one admitted work interface", params: freeze(focus ? { focus } : {}) }),
      freeze({ bin: "read-orchestration", purpose: "inspect the current strategy front", params: freeze(focus ? { focus } : {}) }),
    ]),
  });
}

function pressure(id, weight, signal, response) { return freeze({ id, weight, signal, response }); }
function workView(item, action) { return freeze({ id: item.id, title: item.title ?? item.summary ?? item.id, status: item.status, priority: item.priority ?? null, action, source: "work" }); }


if (import.meta.main) {
  const result = await runJavascriptNodeOperation({
    name: "project-operational-heartbeat",
    description: "Project supplied operating carriers into a heartbeat and next-work view.",
    operation: (input) => projectOperationalHeartbeat(input.carriers ?? input, input.params ?? {}, input.options ?? {}),
    inputSchema: {"type": "object"},
    outputSchema: {"type": "object"},
  }, { arguments: process.argv.slice(2), standardInput: process.stdin, standardOutput: process.stdout });
  process.exitCode = result.exitCode;
}
