import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { STATUSES, normalizeReport, renderReportGraphic } from "../src/deterministic-report-graphic.mjs";
import { main } from "../scripts/render-report-graphic.mjs";

const report = {
  period: "2026-07-18T23:00:00Z/PT1H",
  claims: STATUSES.map((status, index) => ({ subject: `subject-${index}`, id: `claim-${index}`, status })),
};

test("normalizeReport sorts claims into a canonical order", () => {
  const forward = normalizeReport(report);
  const reversed = normalizeReport({ ...report, claims: [...report.claims].reverse() });
  assert.deepEqual(forward, reversed);
});

test("normalizeReport rejects malformed input", () => {
  assert.throws(() => normalizeReport({}), TypeError);
  assert.throws(() => normalizeReport({ period: "p", claims: "not-an-array" }), TypeError);
  assert.throws(() => normalizeReport({ period: "p", claims: [{ subject: "a", id: "x", status: "held" }] }), TypeError, "unknown status");
  assert.throws(
    () => normalizeReport({ period: "p", claims: [report.claims[0], report.claims[0]] }),
    TypeError,
    "duplicate subject+id",
  );
});

test("equal reports produce byte-identical SVG and PNG regardless of claim order", () => {
  const first = renderReportGraphic(report);
  const reordered = renderReportGraphic({ ...report, claims: [...report.claims].reverse() });
  assert.equal(first.svgDigest, reordered.svgDigest);
  assert.equal(first.pngDigest, reordered.pngDigest);
  assert.deepEqual(first.svg, reordered.svg);
  assert.deepEqual(first.png, reordered.png);
});

test("the rendered SVG stays inside the safe monochrome subset", () => {
  const { svg } = renderReportGraphic(report);
  const text = svg.toString("utf8");
  assert.match(text, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" version="1\.2" baseProfile="tiny"/u);
  assert.doesNotMatch(text, /(?:script|style|href|url\(|foreignObject)/iu);
});

test("the rendered PNG has a valid signature and embeds the SVG digest", () => {
  const { svg, svgDigest, png } = renderReportGraphic(report);
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.includes(Buffer.from(`rasterized-from-svg-sha256\0${svgDigest}`)), true);
  assert.equal(svgDigest.startsWith("sha256:"), true);
  assert.ok(svg.length > 0);
});

test("changing a claim's status changes both rendered artifacts", () => {
  const first = renderReportGraphic(report);
  const changed = renderReportGraphic({
    ...report,
    claims: report.claims.map((claim, index) => (index === 0 ? { ...claim, status: "refused" } : claim)),
  });
  assert.notEqual(first.svgDigest, changed.svgDigest);
  assert.notEqual(first.pngDigest, changed.pngDigest);
});

test("CLI writes SVG and PNG files given --svg and --png", () => {
  const dir = mkdtempSync(join(tmpdir(), "report-graphic-cli-"));
  const inputPath = join(dir, "report.json");
  const svgPath = join(dir, "out.svg");
  const pngPath = join(dir, "out.png");
  writeFileSync(inputPath, JSON.stringify(report));
  const code = main([inputPath, "--svg", svgPath, "--png", pngPath]);
  assert.equal(code, 0);
  assert.match(readFileSync(svgPath, "utf8"), /^<svg /u);
  assert.deepEqual(readFileSync(pngPath).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

test("CLI prints a JSON summary to stdout when no output flags are given", () => {
  const dir = mkdtempSync(join(tmpdir(), "report-graphic-cli-"));
  const inputPath = join(dir, "report.json");
  writeFileSync(inputPath, JSON.stringify(report));
  const originalWrite = process.stdout.write.bind(process.stdout);
  let captured = "";
  process.stdout.write = (chunk) => { captured += chunk; return true; };
  let code;
  try {
    code = main([inputPath]);
  } finally {
    process.stdout.write = originalWrite;
  }
  assert.equal(code, 0);
  const summary = JSON.parse(captured);
  assert.equal(summary.svgDigest.startsWith("sha256:"), true);
  assert.equal(summary.pngDigest.startsWith("sha256:"), true);
});
