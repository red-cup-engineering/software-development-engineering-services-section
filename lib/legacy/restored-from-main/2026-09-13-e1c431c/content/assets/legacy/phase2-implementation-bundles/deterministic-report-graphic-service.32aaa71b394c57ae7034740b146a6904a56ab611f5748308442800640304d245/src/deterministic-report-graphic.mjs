import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

// The statuses a tracked claim can carry between two reporting periods.
export const STATUSES = Object.freeze([
  "added",
  "changed",
  "unchanged",
  "retracted",
  "unknown",
  "refused",
  "disputed",
]);

const LABELS = Object.freeze({
  added: "ADDED",
  changed: "CHANGED",
  unchanged: "NO CHANGE",
  retracted: "RETRACTED",
  unknown: "UNKNOWN",
  refused: "REFUSED",
  disputed: "DISPUTED",
});

// A tiny 5x7 bitmap font, used so the chart can be rendered with nothing
// but solid rectangles (see assertSafeSvg below).
const GLYPHS = Object.freeze({
  " ": ["00000","00000","00000","00000","00000","00000","00000"],
  "-": ["00000","00000","00000","11111","00000","00000","00000"],
  ":": ["00000","00100","00100","00000","00100","00100","00000"],
  "/": ["00001","00010","00100","01000","10000","00000","00000"],
  "0": ["01110","10001","10011","10101","11001","10001","01110"],
  "1": ["00100","01100","00100","00100","00100","00100","01110"],
  "2": ["01110","10001","00001","00010","00100","01000","11111"],
  "3": ["11110","00001","00001","01110","00001","00001","11110"],
  "4": ["00010","00110","01010","10010","11111","00010","00010"],
  "5": ["11111","10000","10000","11110","00001","00001","11110"],
  "6": ["01110","10000","10000","11110","10001","10001","01110"],
  "7": ["11111","00001","00010","00100","01000","01000","01000"],
  "8": ["01110","10001","10001","01110","10001","10001","01110"],
  "9": ["01110","10001","10001","01111","00001","00001","01110"],
  A:["01110","10001","10001","11111","10001","10001","10001"], B:["11110","10001","10001","11110","10001","10001","11110"],
  C:["01111","10000","10000","10000","10000","10000","01111"], D:["11110","10001","10001","10001","10001","10001","11110"],
  E:["11111","10000","10000","11110","10000","10000","11111"], F:["11111","10000","10000","11110","10000","10000","10000"],
  G:["01111","10000","10000","10111","10001","10001","01111"], H:["10001","10001","10001","11111","10001","10001","10001"],
  I:["01110","00100","00100","00100","00100","00100","01110"], J:["00001","00001","00001","00001","10001","10001","01110"],
  K:["10001","10010","10100","11000","10100","10010","10001"], L:["10000","10000","10000","10000","10000","10000","11111"],
  M:["10001","11011","10101","10101","10001","10001","10001"], N:["10001","11001","10101","10011","10001","10001","10001"],
  O:["01110","10001","10001","10001","10001","10001","01110"], P:["11110","10001","10001","11110","10000","10000","10000"],
  Q:["01110","10001","10001","10001","10101","10010","01101"], R:["11110","10001","10001","11110","10100","10010","10001"],
  S:["01111","10000","10000","01110","00001","00001","11110"], T:["11111","00100","00100","00100","00100","00100","00100"],
  U:["10001","10001","10001","10001","10001","10001","01110"], V:["10001","10001","10001","10001","10001","01010","00100"],
  W:["10001","10001","10001","10101","10101","10101","01010"], X:["10001","10001","01010","00100","01010","10001","10001"],
  Y:["10001","10001","01010","00100","00100","00100","00100"], Z:["11111","00001","00010","00100","01000","10000","11111"],
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

/** SHA-256 of `bytes`, formatted as `sha256:<hex>`. */
export function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function nonEmptyText(value, maximum = 512) {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && !value.includes("\0");
}

/**
 * Validate and normalize a claim-status report: a labelled period plus a
 * list of claims, each carrying a status drawn from STATUSES. Claims are
 * sorted into a canonical order so that reports differing only in claim
 * order render identically.
 *
 * Throws TypeError on malformed input.
 */
export function normalizeReport(report) {
  if (!report || typeof report !== "object") throw new TypeError("report must be an object");
  if (!nonEmptyText(report.period)) throw new TypeError("period is required");
  if (!Array.isArray(report.claims)) throw new TypeError("claims must be an array");
  const claims = report.claims.map((claim) => {
    if (!nonEmptyText(claim?.subject) || !nonEmptyText(claim?.id) || !STATUSES.includes(claim?.status)) {
      throw new TypeError("each claim needs a subject, an id, and a status from STATUSES");
    }
    return { subject: claim.subject, id: claim.id, status: claim.status };
  }).sort((left, right) => canonical(left).localeCompare(canonical(right)));
  const keys = claims.map((claim) => `${claim.subject}\0${claim.id}`);
  if (new Set(keys).size !== keys.length) throw new TypeError("subject plus id must be unique per claim");
  return { period: report.period, claims };
}

function rect(x, y, width, height, fill = "#000000") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
}

function bitmapText(value, x, y, scale = 3) {
  let output = ""; let cursor = x;
  for (const character of value.toUpperCase()) {
    const glyph = GLYPHS[character] ?? GLYPHS[" "];
    glyph.forEach((row, rowIndex) => [...row].forEach((pixel, columnIndex) => {
      if (pixel === "1") output += rect(cursor + columnIndex * scale, y + rowIndex * scale, scale, scale);
    }));
    cursor += 6 * scale;
  }
  return output;
}

/**
 * Render a normalized report as a bar chart, one bar per status, counting
 * how many claims currently carry it. Returns raw SVG bytes.
 */
export function renderSvg(report) {
  const normalized = normalizeReport(report);
  const counts = Object.fromEntries(STATUSES.map((status) => [status, normalized.claims.filter((claim) => claim.status === status).length]));
  const maximum = Math.max(1, ...Object.values(counts));
  let visual = rect(0, 0, 1000, 620, "#ffffff");
  visual += bitmapText("CLAIM STATUS REPORT", 50, 38, 4);
  visual += bitmapText(`PERIOD ${normalized.period.slice(0, 28)}`, 50, 92, 2);
  STATUSES.forEach((status, index) => {
    const y = 150 + index * 58; const count = counts[status]; const barWidth = Math.round((count / maximum) * 470);
    visual += bitmapText(LABELS[status], 50, y + 5, 2);
    visual += rect(310, y, 474, 30);
    visual += rect(312, y + 2, 470, 26, "#ffffff");
    if (barWidth > 0) visual += rect(312, y + 2, barWidth, 26);
    visual += bitmapText(String(count), 810, y + 5, 2);
  });
  visual += bitmapText(`${normalized.claims.length} CLAIMS`, 50, 574, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny" width="1000" height="620" viewBox="0 0 1000 620"><title>Claim status report</title><desc>Counts of tracked claims by status for the given period.</desc>${visual}</svg>`;
  return Buffer.from(svg, "utf8");
}

/**
 * Confirm `svgBytes` stay inside the restricted, renderer-agnostic subset
 * of SVG Tiny 1.2 this package emits: only <svg>/<title>/<desc>/<rect>
 * tags, only black/white fills, no scripting, styling, or external
 * references. Throws if the SVG contains anything outside that subset.
 */
export function assertSafeSvg(svgBytes) {
  const svg = Buffer.from(svgBytes).toString("utf8");
  if (!svg.startsWith("<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.2\" baseProfile=\"tiny\"")) throw new Error("SVG is not the admitted SVG Tiny 1.2 profile");
  if (/<(?:script|style|foreignObject|iframe|image|use|animate|set|filter)\b|\bhref=|url\(|data:|<!DOCTYPE|<\?xml/iu.test(svg)) throw new Error("SVG contains a forbidden construct");
  const tags = [...svg.matchAll(/<\/?([A-Za-z][A-Za-z0-9]*)/gu)].map((match) => match[1]);
  if (tags.some((tag) => !["svg", "title", "desc", "rect"].includes(tag))) throw new Error("SVG contains an unrendered element");
  const colors = [...svg.matchAll(/fill="([^"]+)"/gu)].map((match) => match[1]);
  if (colors.some((color) => !["#000000", "#ffffff"].includes(color))) throw new Error("SVG exceeds the monochrome profile");
  return true;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii"); const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

/**
 * Rasterize the exact rectangles in `svgBytes` (which must pass
 * assertSafeSvg) into a PNG, pixel for pixel. Because rasterization reads
 * only <rect> primitives on an exact pixel grid, the same SVG bytes always
 * produce the same PNG bytes.
 */
export function rasterizePng(svgBytes) {
  assertSafeSvg(svgBytes);
  const svg = Buffer.from(svgBytes).toString("utf8");
  const root = svg.match(/width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"/u);
  if (!root || root[1] !== root[3] || root[2] !== root[4]) throw new Error("SVG dimensions are not exact pixel coordinates");
  const width = Number(root[1]); const height = Number(root[2]);
  const pixels = Buffer.alloc((width * 4 + 1) * height, 255);
  for (let y = 0; y < height; y += 1) pixels[y * (width * 4 + 1)] = 0;
  const rectangles = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="(#000000|#ffffff)"\/>/gu)];
  if (rectangles.length === 0) throw new Error("SVG has no visual primitives");
  for (const match of rectangles) {
    const [, xValue, yValue, widthValue, heightValue, fill] = match; const rgb = fill === "#000000" ? 0 : 255;
    const x0 = Number(xValue); const y0 = Number(yValue); const x1 = Math.min(width, x0 + Number(widthValue)); const y1 = Math.min(height, y0 + Number(heightValue));
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
      const offset = y * (width * 4 + 1) + 1 + x * 4; pixels[offset] = rgb; pixels[offset + 1] = rgb; pixels[offset + 2] = rgb; pixels[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const svgDigest = sha256(svgBytes);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk("IHDR", header),
    pngChunk("tEXt", Buffer.from(`rasterized-from-svg-sha256\0${svgDigest}`, "utf8")),
    pngChunk("IDAT", deflateSync(pixels, { level: 9 })), pngChunk("IEND", Buffer.alloc(0))]);
}

/**
 * Render a claim-status report straight to SVG and PNG bytes, plus their
 * digests. Because rendering is a pure function of the normalized report,
 * two reports that differ only in claim order produce byte-identical
 * output, and the digests let a caller confirm that without re-rendering.
 *
 * Throws on malformed input (see normalizeReport).
 */
export function renderReportGraphic(report) {
  const svg = renderSvg(report);
  const png = rasterizePng(svg);
  return { svg, svgDigest: sha256(svg), png, pngDigest: sha256(png) };
}
