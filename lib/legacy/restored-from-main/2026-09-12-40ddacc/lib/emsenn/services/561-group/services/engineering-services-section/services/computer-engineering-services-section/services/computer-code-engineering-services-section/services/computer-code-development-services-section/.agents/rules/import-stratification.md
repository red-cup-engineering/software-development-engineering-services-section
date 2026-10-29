<!-- Generated from @red-cup-engineering/agent-root-instructions-projection-service/content/rules/import-stratification.md. Edit the package source. -->

# Import stratification (owner-stated law, 2026-08-30)

- **scripts can import scripts and src.**
- **scripts cannot import apps.**
- **apps can import apps, scripts, and src.**

## Consequences

- A service-level package importing a one-function service package directly
  is CORRECT (e.g. `modeled-union-dimension` importing
  `@lenticule-science/articulating`'s positing scripts). Do not "fix" it by
  re-pointing at an app.
- An app (e.g. `apps/metrologic`) is a composition point: it imports the
  script packages downward and provides the composed surface to other apps
  and to external consumers. Apps are compositions, never origins of logic.
- Never make a script-level package depend on an app to obtain something a
  script package already provides — that inverts the stratification.
- When both a script package and an app expose the same capability, the
  consumer's own stratum picks the door: scripts use the script package;
  apps may use either.

A violation found in existing code is a finding to record (dated JSON in the
owning section's `data/`), never an en-passant fix.
