# 0001 — Defer React 19, Prisma 7, Next 16, and related major upgrades past 2026-05-31

**Status:** Accepted, 2026-05-15
**Author:** Josh Lowe + Claude (cleanup/2026-05-15)
**Supersedes:** —
**Related:** [`docs/upgrade/prisma-7-plan.md`](../upgrade/prisma-7-plan.md), [`docs/audit/react-best-practices-2026-05-15.md`](../audit/react-best-practices-2026-05-15.md), [`.claude/skills/jlowe-dependency-strategy/SKILL.md`](../../.claude/skills/jlowe-dependency-strategy/SKILL.md)

## Context

The 2026-05-15 audit identified 22 outdated packages. Tier 1 (low-risk) and Tier 2 (medium-risk) have been bumped on this branch (`cleanup/2026-05-15`); Tier 3 (high-risk majors) is deferred.

BidOps AI launches **2026-05-31** — 16 days from this ADR. jlowe.ai shares no infrastructure with BidOps, but the personal-brand site is high-visibility during the launch week (résumé/social/press surface) and any breakage is disproportionately costly. The remaining tier is exactly the surface area most likely to break for non-trivial reasons: framework majors, ORM majors, and the WebGL stack.

The cleanup playbook called out Q3 2026 as the re-evaluation window. This ADR codifies that.

## Decision

Pin the following packages at their current versions on `main` after this branch merges. Block automated promotion via the existing dependabot `ignore-major` policy. Re-open in Q3 2026.

### Deferred upgrades

| Package | Current | Latest | Primary reason to defer |
|---|---|---|---|
| `react` | 18.3.1 | 19.2.6 | Gates everything below; rendering changes; many files have `eslint-disable react-hooks/set-state-in-effect` that the React Compiler will reject (17+ source files surveyed in the React audit) |
| `react-dom` | 18.3.1 | 19.2.6 | Paired with `react` |
| `next` | 15.5.18 | 16.2.6 | Pages Router → continues to work; App Router migration is a separate decision; bumping closes the 2 remaining moderate `npm audit` findings (`postcss` chain) but trades them for a much larger churn |
| `prisma` | 5.22.0 | 7.8.0 | Requires 5→6→7 path; new `prisma-client` generator + `@prisma/adapter-pg` driver-adapter touches 15 `@prisma/client` import sites, `lib/prisma.ts` singleton, and Jest `moduleNameMapper`; the 4 raw-SQL `Prisma.sql` sites in `lib/rag/` need integration-test verification under `pg`'s default parser (cosine similarity may parse as `string` instead of `number`). Full plan in [`docs/upgrade/prisma-7-plan.md`](../upgrade/prisma-7-plan.md) |
| `@prisma/client` | 5.22.0 | 7.8.0 | Paired with `prisma` |
| `@react-three/drei` | 9.122.0 | 10.7.7 | Peer-deps on React 19; gated by React upgrade |
| `@react-three/fiber` | 8.18.0 | 9.6.1 | Peer-deps on React 19; gated by React upgrade |
| `eslint` | 9.39.4 | 10.4.0 | Flat-config compat risk with `eslint-config-next`; CI lint gate is load-bearing |
| `@eslint/js` | 9.39.4 | 10.0.1 | Paired with `eslint` |
| `undici` | 7.25.0 | 8.3.0 | Peer-deps cascade through MSW + AWS SDK; verify mocks |
| `typescript` | 5.9.3 | 6.0.3 | Major bump with strict-mode tightening; defer pending React + Prisma compatibility |
| `jest` | 29.7.0 | 30.4.2 | jsdom now marks `window` non-configurable — 26 tests across 8 suites break. Patterns to migrate: `Object.defineProperty(global, "window", ...)` in `__tests__/lib/analytics.test.js`, `shareHelpers.test.js`, `ErrorBoundary.test.jsx`, and similar; CLI flag `--testPathPattern` renamed to `--testPathPatterns`; re-verify MSW `customExportConditions: [""]` interop |
| `jest-environment-jsdom` | 29.7.0 | 30.4.1 | Paired with `jest` |

### What stays current

Everything in Tier 1 and Tier 2 of the dep-strategy SKILL (see commit log under `chore(deps):` between 2026-05-15 and this ADR's commit).

Also explicitly **removed**: `react-intersection-observer` (never imported).

## Consequences

### Costs of deferring

- 2 moderate `npm audit` findings persist (`next` via `postcss` chain). Both require a Next 16 bump to clear; no patch backport exists.
- 26 jest-30 test failures stay latent — re-surface on next attempt.
- React 19 ergonomic wins (ref-as-prop, `useFormStatus`, Server Components in App Router) unavailable.
- Prisma `prisma-client` driver-adapter (which would unblock cleaner pgvector typing) unavailable.
- 9 packages remain on outdated majors visible to anyone running `npm outdated`.

### Why deferring is the right call anyway

- The cleanup plan capped changes at "additive and reversible" during the BidOps launch window. Tier 3 upgrades are neither.
- The Prisma 7 plan ([`docs/upgrade/prisma-7-plan.md`](../upgrade/prisma-7-plan.md)) is 4 phases and ~12 commits; doing it under launch pressure inverts the cost/benefit.
- React 19 + Three.js peer-deps gate is real — `@react-three/drei@10` and `@react-three/fiber@9` both require React 19, and `gsap`/`react-typed`/`react-text-transition` need re-verification. The `forwardRef` boilerplate and `defaultProps` deprecation also need a sweep.
- The audit work in this same branch (`docs/audit/`, `docs/refactor/`) already names which patterns to fix before attempting the upgrades — Q3 2026 attempt starts informed.

## Re-evaluation triggers

Open this ADR for revision when **any** of these happens:

- 2026-09-01 (calendar) — Q3 2026 review window.
- A `next` or `react` CVE lands that we can't patch without bumping.
- A jlowe.ai feature requires React Server Components / App Router (e.g. the planned commercial MCP services product surface).
- React-three-fiber's React 19 support stabilizes _and_ jlowe.ai's WebGL backgrounds have been refactored per `docs/refactor/GitHubContributionGraph-plan.md`.
- Prisma 7 ships a stable path with documented pgvector support (currently only works via raw SQL — same as 5.x for us).

## Implementation note

Version pinning is implicit via the current `^x.y.z` ranges — `npm update` cannot promote across major. The existing `.github/dependabot.yml` ignore-majors policy enforces this for automated PRs. **Do not** add explicit `engines` clamps or `overrides` entries for these packages; if a transitive dep needs a Tier 3 version, it should fail loudly during `npm install` so we revisit this ADR rather than silently upgrade.

If accidental Tier 3 promotion happens via direct `npm install <pkg>@latest`, revert and reference this ADR in the PR description.
