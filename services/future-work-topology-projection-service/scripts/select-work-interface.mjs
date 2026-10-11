#!/usr/bin/env node
import{readFileSync}from"node:fs";import{selectWorkInterface}from"../src/work-interface.mjs";export{selectWorkInterface};if(import.meta.main){const i=JSON.parse(readFileSync(0,"utf8"));process.stdout.write(`${JSON.stringify(selectWorkInterface(i.topology,i.context,i.params,i.options))}\n`);}
