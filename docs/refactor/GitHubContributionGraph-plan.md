# GitHubContributionGraph refactor plan

Target: `components/GitHubContributionGraph.tsx` (630 lines) → coordinator < 250 lines.

Glossary: **module** = unit with interface + implementation. **Deep** = small interface, lots behind. **Seam** = where behaviour can be swapped without editing in place. **Locality** = change/bug/knowledge concentrated in one place.

## 1. What it does

Renders the GitHub contribution calendar section on the home page (`/`):

- Lazy-loads `react-github-calendar` client-side
- Themes blocks with Supernova palette (`SUPERNOVA_COLORS`, lines 40–46)
- Reshapes data for mobile (14 weeks) vs desktop (full year)
- Computes total / current-streak / best-day stats
- Renders three stat cards + a "View on GitHub" link
- GSAP fade-up on scroll (lines 511–535)

Single call site: `pages/index.tsx:44` (already wrapped in `dynamic(..., { ssr: false, loading: spinner })`).

## 2. Dynamic-import pattern (lines 295–331)

`CalendarWrapper` lazy-imports `react-github-calendar` directly via `import("react-github-calendar")`:

- Lines 299–303: 15-second timeout sets `loadingTimeout` flag (just changes loader text — does not abort)
- Lines 305–318: on resolve, validates `module.GitHubCalendar` is a function or `forwardRef` (`$$typeof` check), then `setCalendar(() => Component)`
- Lines 319–324: on reject, sets `error=true` → renders "Unable to load" fallback with GitHub link (lines 414–432)
- Lines 326–329: cleanup clears timeout, flips `mounted=false`

This sits **inside** `CalendarWrapper`. The wrapper itself is also lazy-loaded via Next's `dynamic()` at `pages/index.tsx:44`, so this is a second layer of lazy-load for the underlying npm package.

## 3. Generalization decision: NO — inline-extract instead

Call sites of `next/dynamic` in this codebase:

| Site | Target | Pattern |
|------|--------|---------|
| `pages/index.tsx:44` | `@/components/GitHubContributionGraph` | Next `dynamic` + `ssr:false` + `loading` |
| `pages/index.tsx:56` | `@/components/SpaceBackground` | Next `dynamic` + `ssr:false` + `loading` |
| `components/HeroSection.tsx:47` | `react-typed` (then-mapped to named export) | Next `dynamic` + `ssr:false` + `loading` |
| `components/_design/HeroV2.tsx:21` | `./FluidHeatShader` | Next `dynamic` + `ssr:false` |

All four use Next's built-in `dynamic()` with `ssr:false` + an optional `loading` prop. **None of them implement** the 15s-timeout / error-fallback / `$$typeof` validation that `CalendarWrapper` does. That bespoke pattern has exactly **one user**.

Deletion test: if I delete a hypothetical `useDynamicComponent` hook today, complexity reappears in exactly one file. That fails the "two adapters = real seam" rule. A `LazyMount` component would be a **shallow** module — its interface (timeout, fallback, validator) would be almost as wide as its implementation.

**Recommendation:** keep the pattern inline. Extract `CalendarWrapper` into its own file `components/GitHub/LazyCalendar.tsx` so it stops bloating the coordinator, but do **not** generalize. Revisit only if a second consumer appears.

Update the `CONTEXT.md` open-question entry (line 42) to reflect this decision after the refactor lands (or convert it to a small ADR — see step 6).

## 4. Stats extraction → `lib/github/calendar-stats.ts`

The same total / streak / best-day calculation lives in **two places** in the file:

- Lines 236–255 (direct-API fast-path inside `testAPI`)
- Lines 266–293 (`calculateStats`, called from `transformData`)

Both sort by date desc, then walk the array accumulating `total`, `bestDay`, and a `currentStreak` that stops at the first zero-count day. Extract once:

```ts
// lib/github/calendar-stats.ts
export interface ContributionDay { date: string; count: number; level?: number }
export interface ContributionStats { total: number; bestDay: number; currentStreak: number }
export function calculateContributionStats(days: ContributionDay[]): ContributionStats { /* … */ }
```

Pure function, no React, no refs, no side effects. Unit-testable with table-driven fixtures (empty array, all-zero, single day, broken streak, all-active). Currently **untestable** because it's tangled with `useRef`, `setState`, and a `setTimeout`.

Also extract the mobile 14-week window logic from `transformData` (lines 371–407) into `lib/github/calendar-stats.ts` as `windowToMobile14Weeks(days): ContributionDay[]` — another pure function, table-testable.

## 5. Presentation extraction → `components/GitHub/StatsCards.tsx`

Move the visual cards out of the coordinator:

- `StatCard` (lines 75–115) — single card, `{ label, value, icon, color }`
- `StatsRow` (lines 121–171) — composes three `StatCard`s with hardcoded icons + labels
- `MobileColorLegend` (lines 53–65) — co-located with the calendar, move into `LazyCalendar.tsx`
- `SUPERNOVA_COLORS` / `supernovaTheme` (lines 40–50) — move into `LazyCalendar.tsx` (only used there)

`StatsCards.tsx` exposes one default export `<StatsCards stats={…} />`. The three SVG icons stay inline (already are).

## 6. Refactor commit sequence

Each commit compiles, tests pass, behaviour unchanged.

1. **`refactor(github): extract calendar-stats pure functions`**
   - New file `lib/github/calendar-stats.ts` with `calculateContributionStats` + `windowToMobile14Weeks` + the two interfaces.
   - New file `lib/github/calendar-stats.test.ts` with table-driven coverage.
   - `GitHubContributionGraph.tsx` imports both and replaces the two inline copies (lines 238–255, 266–293) and the mobile-windowing block (lines 371–407).
   - Net diff: ~-90 lines in the component, +60 lines of pure code + tests.

2. **`refactor(github): extract StatsCards presentation`**
   - New `components/GitHub/StatsCards.tsx` containing `StatCard` + `StatsRow` (renamed default export `StatsCards`). Import the `ContributionStats` type from `lib/github/calendar-stats`.
   - Coordinator drops lines 67–171 and renders `{stats.total > 0 && <StatsCards stats={stats} />}`.
   - Snapshot/render tests for `StatsCards` (jsdom + React Testing Library — already wired in `jest.setup.js`).

3. **`refactor(github): extract LazyCalendar wrapper`**
   - New `components/GitHub/LazyCalendar.tsx` containing `CalendarWrapper` (renamed default export `LazyCalendar`), `MobileColorLegend`, `SUPERNOVA_COLORS`, `supernovaTheme`, the 15s-timeout dynamic-import block, the `testAPI` direct-fetch fallback, the `transformData` callback, and both loading/error UI states.
   - Coordinator imports `LazyCalendar` and renders it inside the `<Card>` (replacing lines 583–593).
   - Add an ADR note in `docs/adr/` (1 paragraph) recording **why** this stays inline and not a shared `useDynamicComponent` — so a future explorer doesn't re-suggest the same refactor. Update `CONTEXT.md` line 42 to point at the ADR.

4. **`chore(github): remove debug logs from LazyCalendar`** *(optional, separate commit so it's reviewable)*
   - The `[DEBUG]` `console.log` calls at lines 209, 214, 224–227, 237 and the entire `apiTestResult` UI affordance (lines 446–453) were a diagnostic for an API outage. The direct-API path is the production fast-path; keep it but drop the `apiTestResult` state + UI, and convert `console.log` to a single `console.warn` on error.
   - Verify by running `npm run dev` and confirming the calendar still renders both when `react-github-calendar` loads cleanly and when network is throttled.

## 7. Final shape

`components/GitHubContributionGraph.tsx` — coordinator only, target ~140 lines:

```tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card } from "@/components/ui";
import { getPrefersReducedMotion, useIsMobile } from "@/lib/hooks";
import LazyCalendar from "@/components/GitHub/LazyCalendar";
import StatsCards from "@/components/GitHub/StatsCards";
import type { ContributionStats } from "@/lib/github/calendar-stats";

export default function GitHubContributionGraph({ username = "joshrlowe", title, description }) {
  // sectionRef + contentRef + mounted + isMobile + stats state
  // single useEffect for GSAP fade-up (unchanged from lines 511–535)
  // handleDataLoaded callback (unchanged from lines 537–539)
  // JSX: header + <Card><LazyCalendar/></Card> + {stats.total>0 && <StatsCards/>} + GitHub link
}
```

Responsibilities by file:

- `lib/github/calendar-stats.ts` — pure data transformation
- `components/GitHub/LazyCalendar.tsx` — the package-loading + theming + responsive-window concerns
- `components/GitHub/StatsCards.tsx` — three cards
- `components/GitHubContributionGraph.tsx` — section chrome + GSAP scroll animation + composes the three

## 8. Risks

- **Mobile (14-week) vs desktop (full-year)**: `transformData` is invoked by `react-github-calendar` with the *full* dataset; the mobile branch filters it down by sorting then slicing the last 98 days back to the previous Sunday (lines 379–406). The stats must always be computed from the **unfiltered** data — the `contributionsRef.current.length` guard at line 351 protects this ("only replace ref if new data is at least as large"). When extracting `windowToMobile14Weeks`, ensure stats are computed *before* windowing, not after.
- **`statsCalculatedRef` / `contributionsRef` flag dance**: the component currently has **two** parallel stat-calculation paths (direct-API fetch at lines 236–255 racing the calendar's `transformData` callback). `statsCalculatedRef` is the "first one wins" mutex. When extracting, preserve this: the pure `calculateContributionStats` must remain caller-agnostic, and the mutex stays inside `LazyCalendar`. Do **not** call `setStats` twice with different totals on re-mount.
- **Animation / transition behaviour**: GSAP `ScrollTrigger.getAll().forEach(t => t.kill())` in cleanup (line 533) kills **all** triggers on the page, not just this section's. Two other components on `/` use ScrollTrigger; killing all is currently OK because this section unmounts only on route change, but if the coordinator's effect ever runs more often, it could kill siblings' triggers mid-animation. Out of scope for this refactor — note it.
- **`onDataLoaded` ref pattern (lines 198–203)**: the `onDataLoadedRef` indirection exists so the once-only `useEffect` at line 206 doesn't capture a stale callback. Keep this when moving into `LazyCalendar.tsx` — removing it would re-introduce a stale-closure bug.
- **The `module.GitHubCalendar.$$typeof` check (line 312)**: this guards against the library shipping a `forwardRef` object rather than a function. The library has done both historically. Preserve verbatim.
- **`pages/index.tsx:44` already wraps in `dynamic({ ssr: false })`** — the inner lazy-import in `LazyCalendar` is a *second* layer, lazy-loading the npm package after the wrapper has mounted. Both layers are intentional: the outer one keeps the package out of the home page's initial JS bundle; the inner one shows a spinner while the package downloads. Don't collapse them.
