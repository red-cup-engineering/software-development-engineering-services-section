import assert from "node:assert/strict";
import test from "node:test";
import { projectFutureWorkTopology } from "../src/future-work-topology.mjs";
test("projects goal, work and operation records without manufacturing context journals", () => {
 const result=projectFutureWorkTopology({goals:{open:["g"],goals:[{id:"g",title:"Goal",text:"coordinate agent",status:"active",evidence:[]}]},work:{items:[]},readiness:{criteria:[]},processors:["start-work"]},{intent:"coordinate agent"},{generatedAt:"2026-08-30T00:00:00.000Z"});
 assert.equal(result.strata.future.nodes.includes("g"),true);
 assert.equal(result.strata.present.nodes.length,3);
 assert.equal(result.predication.cells.length>0,true);
 assert.equal(result.nodes.some(({id})=>id==="present-log:context"||id==="past-state:context"),false);
});
