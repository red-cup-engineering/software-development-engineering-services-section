# deterministic-report-graphic

Renders a claim-status report — a labelled period plus a list of claims,
each tagged `added`, `changed`, `unchanged`, `retracted`, `unknown`,
`refused`, or `disputed` — as a bar chart, output as both SVG and PNG.

Rendering is deterministic: claims are sorted into a order before
drawing, so two reports that list the same claims in a different order
produce byte-identical SVG and PNG output. The SVG is restricted to a
minimal, safe subset (solid black/white rectangles, no scripts, styles, or
external references) and the PNG is rasterized pixel-for-pixel from that
same SVG, so the two always agree.

## Install

```
npm install
```

## Usage

### CLI

```
render-report-graphic report.json --svg report.svg --png report.png
```

Reads a JSON report from a file (or from stdin with `-`) and writes the
chart to the given paths. Without `--svg`/`--png`, it prints a JSON summary
(digests and base64-encoded bytes) to stdout instead.

Input shape:

```json
{
  "period": "2026-07-18T23:00:00Z/PT1H",
  "claims": [
    { "subject": "north-bridge-repair", "id": "budget", "status": "changed" },
    { "subject": "north-bridge-repair", "id": "completion-date", "status": "unknown" }
  ]
}
```

### API

```js
import { renderReportGraphic, normalizeReport, STATUSES } from "./src/deterministic-report-graphic.mjs";

const { svg, svgDigest, png, pngDigest } = renderReportGraphic(report);
```

- `STATUSES` — the seven valid claim statuses.
- `normalizeReport(report)` — validates a report and returns it with claims
  sorted into order; throws `TypeError` on malformed input.
- `renderSvg(report)` / `rasterizePng(svgBytes)` — render each stage on its
  own.
- `renderReportGraphic(report)` — renders both in one call and returns
  `{ svg, svgDigest, png, pngDigest }`, where `svgDigest`/`pngDigest` are
  `sha256:<hex>` strings.
- `assertSafeSvg(svgBytes)` — throws unless `svgBytes` stays inside the
  restricted SVG subset this package emits.

## Tests

```
npm test
```
