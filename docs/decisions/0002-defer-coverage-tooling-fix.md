# 0002 — Defer coverage tooling fix to Tier 3 jest 30 upgrade

## Status

Accepted, 2026-05-16

## Context

`npm run test:coverage` fails with `TypeError: minimatch is not a function`
from `babel-plugin-istanbul`. The failure was introduced in Phase 1 (2026-05-15)
when the `minimatch: "^9.0.7"` override was added to `package.json` to
remediate NPM-11 (three minimatch ReDoS CVEs in build-tooling chains: jest,
eslint-config-next, @eslint/eslintrc).

`babel-plugin-istanbul` expects the pre-9 callable `minimatch` API; the
override forces v9, which broke the call site at
`node_modules/babel-plugin-istanbul/lib/index.js:108:21`.

The original cleanup playbook v2 update promoted jest 29 → 30 to the first
slot of Phase 5 Tier 2 specifically to resolve this — jest 30 drops the
`babel-plugin-istanbul` dependency on the old callable minimatch API
entirely. In Phase 5 Wave 4, jest 30 was deferred to Tier 3 because the
upgrade produced 26 jsdom-window-mock failures requiring config surgery
beyond the cleanup sprint's scope.

The 70% coverage gate declared in `jest.config.js > coverageThreshold`
cannot currently be enforced. `npm test` (no instrumentation) is
unaffected — all 2,822 tests pass.

## Decision

Defer the coverage tooling fix to the Tier 3 jest 30 upgrade tracked in
`docs/decisions/0001-defer-major-react-prisma-next-upgrades.md`. Do not:

- Remove the `minimatch ^9.0.7` override (reopens NPM-11 — three high vulns
  in build tooling).
- Pin `babel-plugin-istanbul` to a specific version (the version that
  supports minimatch v9 is bundled with jest 30; a manual pin would create
  a jest-internal version skew).
- Apply a targeted nested override (e.g.
  `"babel-plugin-istanbul": { "test-exclude": { "minimatch": "^3.1.4" } }`) —
  npm 11's nested override resolution is unreliable and silent failure
  modes are worse than the clean break.

## Consequences

- `npm run test:coverage` will continue to fail until jest 30 lands.
- CI coverage threshold checks (if any are added) will need to skip
  `test:coverage` and rely on `npm test` for pass/fail until then.
- The Wave 8 refactor of `AboutSettingsSection` (1,084 → 196 lines + 6 new
  modular sub-components) ships without coverage signal on the new files.
  The integration test in `__tests__/components/AboutSettingsSection.test.jsx`
  exercises end-to-end behavior; per-component unit coverage will need
  retroactive tests when coverage tooling is restored.

## Triggers to revisit

- Jest 30 upgrade lands (whenever Tier 3 is unfrozen post-BidOps launch).
- A breaking security advisory emerges in the current minimatch or
  babel-plugin-istanbul versions.
- CI gains a coverage enforcement step that needs the tool working.
