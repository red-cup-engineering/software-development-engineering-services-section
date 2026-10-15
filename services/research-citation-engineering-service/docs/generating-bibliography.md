---
kind: text
title: Generating the bibliography
---

# Generating the bibliography

`references.bib` is a build artifact.
The source of truth is every note's frontmatter `references:` block; the bib is the union, deduped by key.

## Running the generator

From within the research domain (anywhere with `research.toml` at or above the current directory):

```bash
cite-tool generate                  # writes <root>/references.bib
cite-tool generate --out path.bib   # writes elsewhere
cite-tool check                     # validate without writing
cite-tool list                      # print collected references to stdout
```

`cite-tool` walks the domain's `lib_dirs` (declared in `research.toml`), harvests every frontmatter `references:` block, and writes the result.

## What's in the bib

For each cite-key, exactly one entry.
The renderer:

- Emits BibTeX in the canonical `@type{key, ...}
  ` form.
- Joins multiple authors with ` and ` and reorders to `Lastname, Firstname`.
- Maps `arxiv: <id>` → biblatex `eprint = {<id>}, eprinttype = {arxiv}`, which lets citeproc auto-render the arXiv URL.
- Drops corpus-internal frontmatter fields (`kind`, `status`, `depends-on`, …) — those describe the citing note in the corpus, not the cited work.
- Passes unknown fields through as-is.

## Conflict resolution

If two notes declare the same key with different metadata:

- **Inline-vs-inline**: first declaration wins (alphabetical by source path); subsequent declarations surface as `inline-mismatch` warnings.

If a `references/<key>.md` file exists for the same key, its frontmatter fills in any fields the inline declarations didn't carry, never overriding.
If a `references/<key>.md` file exists for a key nothing cites, it's added to the bib silently — research notes can predate citation.

## Wiring into Pandoc

The composer (`monograph-composer`) calls `cite-tool generate` as a pre-pandoc step automatically — the generated bib lands in `<root>/tools/build/references.bib` and pandoc resolves `[@key]` citations against that file.
No manual step required when composing.

For ad-hoc pandoc invocations:

```bash
cite-tool generate --out /tmp/refs.bib
pandoc note.md --citeproc --bibliography /tmp/refs.bib -o note.pdf
```

## Why generate, not maintain

A hand-edited `references.bib` drifts from the notes that cite it.
With the generated model:

- Each note declares its own citations with full metadata.
  Reading the note tells you what it cites.
- The cite-key only exists because some note declared it.
- A note moved or deleted is a citation moved or deleted — the bib reflects reality on every regeneration.

The trade-off is that you commit the generated bib alongside the source of truth (since pandoc needs it at composition time), and you must remember to regenerate before composing — but `monograph-composer` handles that for you in the standard publishing flow.
