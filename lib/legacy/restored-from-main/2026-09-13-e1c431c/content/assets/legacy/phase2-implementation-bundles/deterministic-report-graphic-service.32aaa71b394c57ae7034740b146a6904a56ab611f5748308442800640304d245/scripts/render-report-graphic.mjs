#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { renderReportGraphic } from "../src/deterministic-report-graphic.mjs";

function usage() {
  return [
    "Usage: render-report-graphic <input.json | -> [--svg out.svg] [--png out.png]",
    "",
    "Reads a claim-status report as JSON (from a file, or from stdin when the",
    "path is '-') and renders it as a deterministic bar-chart SVG and PNG.",
    "",
    "  { \"period\": \"2026-07-18/PT1H\",",
    "    \"claims\": [ { \"subject\": \"...\", \"id\": \"...\", \"status\": \"added\" } ] }",
    "",
    "With --svg and/or --png, writes the corresponding image to that path.",
    "With neither flag, prints a JSON summary (digests and base64 bytes) to stdout.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { input: undefined, svg: undefined, png: undefined };
  const rest = [...argv];
  while (rest.length > 0) {
    const token = rest.shift();
    if (token === "--svg") args.svg = rest.shift();
    else if (token === "--png") args.png = rest.shift();
    else if (token === "--help" || token === "-h") args.help = true;
    else if (args.input === undefined) args.input = token;
  }
  return args;
}

export function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.input) {
    process.stdout.write(`${usage()}\n`);
    return args.help ? 0 : 2;
  }
  const raw = args.input === "-" ? readFileSync(0, "utf8") : readFileSync(args.input, "utf8");
  const report = JSON.parse(raw);
  const { svg, svgDigest, png, pngDigest } = renderReportGraphic(report);
  if (args.svg) writeFileSync(args.svg, svg);
  if (args.png) writeFileSync(args.png, png);
  if (!args.svg && !args.png) {
    process.stdout.write(`${JSON.stringify({ svgDigest, svgBase64: svg.toString("base64"), pngDigest, pngBase64: png.toString("base64") })}\n`);
  }
  return 0;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
