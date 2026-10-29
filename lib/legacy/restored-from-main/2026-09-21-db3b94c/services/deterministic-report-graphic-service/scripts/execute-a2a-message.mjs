#!/usr/bin/env node
import{readFileSync}from"node:fs";import{executeA2aMessage}from"@red-cup-engineering/computer-blockchain-system-services-section/deterministic-report-graphic-a2a-executor";try{process.stdout.write(`${JSON.stringify(await executeA2aMessage(JSON.parse(readFileSync(0,"utf8"))))}\n`);}catch(error){process.stderr.write(`${error.stack??error.message}\n`);process.exitCode=1;}
