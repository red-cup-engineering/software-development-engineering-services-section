# research/citations

Frontmatter-canonical citation toolkit.
The model:

- A note declares the works it cites in its **own** frontmatter — the `references:` array is the **canonical source of truth** for citation metadata:
  ```yaml
  references:
    - key: arnold1995hermitian
      type: article
      authors: [V. I. Arnold]
      year: 1995
      title: "Remarks on eigenvalues..."
      journal: "Selecta Mathematica New Series 1(1), 1–19"
  ```
- The note's body cites with Pandoc syntax: `[@arnold1995hermitian]`.
- Optionally, a domain may have a `references/<key>.md` annotation file hosting long-form prose notes on the source.
  Annotation frontmatter *supplements* inline declarations (fills in missing fields) but never overrides them — inline wins on overlap.
- `references.bib` is a **build artifact**, generated from the union of inline `references:` blocks across the domain plus any supplementary fields from annotation files, deduped by key.

## Packages

- `research-citations/` — library: schema, corpus loader, BibTeX renderer, cite-key generator (Better BibTeX standard).
- `cite-tool/` — CLI: `cite-tool generate` writes the merged bib; `cite-tool check` validates without writing.

## Run

```
cd /path/to/research-program       # contains research.toml
cite-tool generate                 # writes <root>/references.bib (or as configured)
cite-tool check                    # exit 1 if broken / inconsistent
```
