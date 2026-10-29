#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { rawNiUri } from "@red-cup-engineering/relation-model-notation-runtime/canonical-cbor";
import { decodeSemantic, semanticBytes } from "@red-cup-engineering/relation-model-notation-cbor-codec";
import { admitBoundedAgenticIntent } from "./admit-bounded-agentic-intent.mjs";

function fail(message) {
  throw new TypeError(message);
}

function requestBytes(message) {
  const candidates = (Array.isArray(message?.parts) ? message.parts : [])
    .filter((part) => part?.mediaType === "application/rmn+cbor" && typeof part?.raw === "string");
  if (candidates.length !== 1) fail("A2A request requires exactly one application/rmn+cbor raw part");
  const bytes = Buffer.from(candidates[0].raw, "base64");
  if (bytes.length === 0 || bytes.toString("base64") !== candidates[0].raw) {
    fail("A2A request RMN bytes are empty or noncanonical base64");
  }
  const identity = rawNiUri(bytes);
  if (candidates[0].metadata?.ni !== identity) fail("A2A request RMN identity does not match its bytes");
  return bytes;
}

let source = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { source += chunk; });
process.stdin.on("end", () => {
  const request = decodeSemantic(requestBytes(JSON.parse(source)));
  const result = admitBoundedAgenticIntent(request);
  const bytes = semanticBytes(result);
  const ni = rawNiUri(bytes);
  process.stdout.write(`${JSON.stringify({
    messageId: randomUUID(),
    role: "ROLE_AGENT",
    parts: [{
      raw: bytes.toString("base64"),
      metadata: { ni },
      filename: "deterministic-intent-admission-result.rmn.cbor",
      mediaType: "application/rmn+cbor"
    }],
    metadata: {
      operation: "admit-bounded-agentic-intent"
    }
  })}\n`);
});
