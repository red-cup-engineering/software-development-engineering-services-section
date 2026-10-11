#!/usr/bin/env node
import{readFileSync}from"node:fs";import{projectOrganizationalProfile}from"../src/organizational-profile.mjs";export{projectOrganizationalProfile};if(import.meta.main){const i=JSON.parse(readFileSync(0,"utf8"));process.stdout.write(`${JSON.stringify(projectOrganizationalProfile(i.sources,i.params,i.options))}\n`);}
