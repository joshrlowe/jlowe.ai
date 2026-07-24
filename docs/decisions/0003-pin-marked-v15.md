# 0003 — Pin marked at v15 instead of latest v18

## Status

Accepted, 2026-05-16

## Context

Phase 5 Tier 2 (Wave 3, commit `3258531`) bumped `marked` from 13 to 15
instead of the latest v18. Reason: marked v16+ ships as pure ESM with no
CommonJS interop. Jest 29 (currently pinned per Tier 3 ADR) cannot
transform ESM-only packages without significant `transformIgnorePatterns`
and `extensionsToTreatAsEsm` configuration that would risk other test
suites.

marked is used in:

- `lib/rag/` chat citations rendering
- Article body rendering via `react-markdown` (which uses `remark-gfm`,
  not marked directly — marked is for the admin preview path)
- `components/admin/MarkdownEditor.tsx` preview

v15 is the latest version that supports CommonJS require/import patterns
compatible with our jest 29 + babel + nextjs setup.

## Decision

Pin `marked` at `~15.x.x` in `package.json`. Do not auto-upgrade across
this boundary via Dependabot or `npm update`.

## Consequences

- `marked` will continue to show as outdated in `npm outdated` until the
  jest 30 upgrade (Tier 3) makes ESM-only packages tractable.
- Any future contributor running `npm install marked@latest` will need
  to see this ADR first.
- Loss of marked v16+ improvements (mainly performance and additional
  GFM extensions); none are currently used in our codebase.

## Triggers to revisit

- Jest 30 lands and ESM transform configuration is in place (tracked in
  `docs/decisions/0001-defer-major-react-prisma-next-upgrades.md` and
  `docs/decisions/0002-defer-coverage-tooling-fix.md`).
- A breaking security advisory in marked 15.x.
- A feature in marked 16+ becomes needed (e.g., a new extension we want).
