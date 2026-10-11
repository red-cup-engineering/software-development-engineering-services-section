#!/usr/bin/env node
import{readFileSync}from"node:fs";import{projectFutureWorkTopology}from"../src/future-work-topology.mjs";export{projectFutureWorkTopology};if(import.meta.main){const i=JSON.parse(readFileSync(0,"utf8"));process.stdout.write(`${JSON.stringify(projectFutureWorkTopology(i.sources,i.params,i.options))}\n`);}
