# jlowe.ai Audit Report

**Generated:** 2026-05-15
**Commit:** d3abd14a499658fd6b0154ad6249531cf7dce88d
**Branch:** consolidation/2026-05-07
**Working tree:** 20 modified + 7 untracked (not clean)

---

## Section 1: Project Foundation

### 1. Framework + version

- **Next.js 15.1.4** (declared in `package.json`, installed 15.5.9 per `npm outdated`). Pages Router (no `app/` directory).
- React 18.3.1, react-dom 18.3.1.
- Identifiers: `next.config.mjs` present; no `astro.config.*` / `remix.config.*` / `svelte.config.*`.

### 2. Project file tree (depth 3, key directories)

```
.
├── .github/
│   ├── workflows/   (release.yml, stale.yml, test.yml)
│   ├── BRANCH_PROTECTION.md, QUICK_REFERENCE.md, TESTING_SUMMARY.md, WORKFLOW_SETUP.md
│   └── dependabot.yml
├── __fixtures__/    (api-responses.js, projects.js, user.js)
├── __mocks__/       (@prisma, @react-three, @vercel, gsap, next, next-auth, …)
├── __tests__/       (api/, components/, integration/, lib/, pages/, setup/, unit/)
├── components/      (About, Articles, Chat, Project, SpaceBackground, _design, admin, icons, ui, …)
├── coverage/        (HTML/lcov from last test:coverage run)
├── e2e/             (9 Playwright spec files + snapshots + helpers)
├── lib/             (analytics, auth, bedrock, chat, config, email, fonts, hooks, jobs, moderation, observability, prisma, rag, types, utils)
├── pages/           (_app, _document, about, contact, index, projects, admin/, api/, articles/, design/, projects/, resources/)
├── prisma/          (schema.prisma + 5 migrations)
├── public/          (favicon.ico, manifest.json, sw.js, images/, uploads/)
├── scripts/         (generate-embeddings.ts, regenerate-embeddings.ts, migrate-*.js, seed-*.js, test-prisma-connection.js)
├── styles/          (globals.css 955 lines, toast.css)
├── test-results/    (Playwright run artifacts — many)
├── verification-2026-05-07/, verification-2026-05-08/  (prior verification logs)
├── eslint.config.mjs, jest.config.js, jest.polyfills.js, jest.setup.js,
│   lighthouserc.json, middleware.ts, next-env.d.ts, next.config.mjs,
│   playwright.config.ts, postcss.config.mjs, tsconfig.json, vercel.json
├── README.md (478 lines), FUTURE_PLANS.md (in .gitignore), test-utils.jsx
└── package.json, package-lock.json (706 KB)
```

Note: `tree` is not installed locally — output reconstructed from `find -maxdepth 3`.

### 3. Build system / bundler

- Next.js default build (`next build`). No custom bundler config beyond `webpack(config, {isServer})` override in `next.config.mjs` that externalizes `next-auth/providers/credentials` server-side and falls back `fs:false` client-side.
- No Vite / Rollup / esbuild config files. Turbopack not explicitly enabled.

### 4. Package manager

- **npm** — `package-lock.json` present (706 KB). No `yarn.lock`, no `pnpm-lock.yaml`, no `bun.lockb`.

### 5. Node version pinning

- `.nvmrc`: **absent**
- `.node-version`: absent
- `.tool-versions`: absent
- `package.json#engines`: **absent**
- CI pin: `.github/workflows/test.yml` declares `env.NODE_VERSION: '20'`
- Local interpreter: Node v24.10.0, npm 11.12.1

### 6. TypeScript vs JavaScript ratio (all dirs, excludes node_modules/.next/coverage/.swc)

| Extension | File count |
| --------- | ---------- |
| `.ts`     | 138        |
| `.tsx`    | 103        |
| `.js`     | 99         |
| `.jsx`    | 93         |

TS+TSX = 241; JS+JSX = 192. Includes test, mock, fixture, and script files.

### 7. Monorepo indicators

- No `workspaces` field in `package.json`
- No `turbo.json`, `nx.json`, `pnpm-workspace.yaml`
- **Not a monorepo.**

---

## Section 2: Dependencies & Supply Chain

### 8. Production dependencies (38)

```
@ai-sdk/amazon-bedrock         ^4.0.50
@ai-sdk/react                  ^3.0.75
@aws-sdk/client-bedrock-runtime ^3.985.0
@prisma/client                 ^5.20.0
@react-three/drei              ^9.122.0
@react-three/fiber             ^8.18.0
@upstash/ratelimit             ^2.0.8
@upstash/redis                 ^1.36.2
@vercel/analytics              ^1.6.1
@vercel/blob                   ^2.0.0
@vercel/kv                     ^3.0.0
ai                             ^6.0.73
bcryptjs                       ^2.4.3
cheerio                        ^1.2.0
dotenv                         ^16.4.5
gsap                           ^3.14.2
inngest                        ^4.3.0
langfuse                       ^3.38.20
marked                         ^13.0.3
next                           ^15.1.4
next-auth                      ^4.24.13
openai                         ^6.18.0
prisma                         ^5.20.0
prismjs                        ^1.29.0
react                          ^18
react-dom                      ^18
react-github-calendar          ^5.0.4
react-intersection-observer    ^9.13.0
react-markdown                 ^9.1.0
react-syntax-highlighter       ^16.1.0
react-text-transition          ^3.1.0
react-toastify                 ^10.0.5
react-typed                    ^2.0.12
remark-gfm                     ^4.0.0
remark-prism                   ^1.3.6
resend                         ^6.12.2
slugify                        ^1.6.6
three                          ^0.182.0
uuid                           ^13.0.0
```

### 9. Dev dependencies (21)

```
@axe-core/playwright           ^4.11.0
@eslint/eslintrc               ^3.3.3
@eslint/js                     ^9.39.2
@playwright/test               ^1.57.0
@tailwindcss/postcss           ^4.1.18
@testing-library/jest-dom      ^6.9.1
@testing-library/react         ^14.3.1
@testing-library/user-event    ^14.6.1
@types/bcryptjs                ^2.4.6
autoprefixer                   ^10.4.23
eslint                         ^9.39.2
eslint-config-next             ^16.1.1
globals                        ^17.0.0
identity-obj-proxy             ^3.0.0
jest                           ^29.7.0
jest-axe                       ^10.0.0
jest-environment-jsdom         ^29.7.0
msw                            ^2.12.7
postcss                        ^8.5.6
tailwindcss                    ^4.1.18
tsx                            ^4.21.0
undici                         ^7.18.2
```

### 10. Outdated packages (`npm outdated --json`) — 47 entries

| Package                         | Current | Wanted   | Latest      |
| ------------------------------- | ------- | -------- | ----------- |
| @ai-sdk/amazon-bedrock          | 4.0.50  | 4.0.107  | 4.0.107     |
| @ai-sdk/react                   | 3.0.75  | 3.0.185  | 3.0.185     |
| @aws-sdk/client-bedrock-runtime | 3.985.0 | 3.1048.0 | 3.1048.0    |
| @axe-core/playwright            | 4.11.0  | 4.11.3   | 4.11.3      |
| @eslint/eslintrc                | 3.3.3   | 3.3.5    | 3.3.5       |
| @eslint/js                      | 9.39.2  | 9.39.4   | **10.0.1**  |
| @playwright/test                | 1.57.0  | 1.60.0   | 1.60.0      |
| @prisma/client                  | 5.22.0  | 5.22.0   | **7.8.0**   |
| @react-three/drei               | 9.122.0 | 9.122.0  | **10.7.7**  |
| @react-three/fiber              | 8.18.0  | 8.18.0   | **9.6.1**   |
| @tailwindcss/postcss            | 4.1.18  | 4.3.0    | 4.3.0       |
| @testing-library/react          | 14.3.1  | 14.3.1   | **16.3.2**  |
| @upstash/redis                  | 1.36.2  | 1.38.0   | 1.38.0      |
| @vercel/analytics               | 1.6.1   | 1.6.1    | **2.0.1**   |
| @vercel/blob                    | 2.0.0   | 2.3.3    | 2.3.3       |
| ai                              | 6.0.73  | 6.0.183  | 6.0.183     |
| autoprefixer                    | 10.4.23 | 10.5.0   | 10.5.0      |
| bcryptjs                        | 2.4.3   | 2.4.3    | **3.0.3**   |
| dotenv                          | 16.6.1  | 16.6.1   | **17.4.2**  |
| eslint                          | 9.39.2  | 9.39.4   | **10.4.0**  |
| eslint-config-next              | 16.1.1  | 16.2.6   | 16.2.6      |
| globals                         | 17.0.0  | 17.6.0   | 17.6.0      |
| gsap                            | 3.14.2  | 3.15.0   | 3.15.0      |
| inngest                         | 4.3.0   | 4.4.0    | 4.4.0       |
| jest                            | 29.7.0  | 29.7.0   | **30.4.2**  |
| jest-environment-jsdom          | 29.7.0  | 29.7.0   | **30.4.1**  |
| marked                          | 13.0.3  | 13.0.3   | **18.0.3**  |
| msw                             | 2.12.7  | 2.14.6   | 2.14.6      |
| next                            | 15.5.9  | 15.5.18  | **16.2.6**  |
| next-auth                       | 4.24.13 | 4.24.14  | 4.24.14     |
| openai                          | 6.18.0  | 6.38.0   | 6.38.0      |
| postcss                         | 8.5.6   | 8.5.14   | 8.5.14      |
| prisma                          | 5.22.0  | 5.22.0   | **7.8.0**   |
| react                           | 18.3.1  | 18.3.1   | **19.2.6**  |
| react-dom                       | 18.3.1  | 18.3.1   | **19.2.6**  |
| react-github-calendar           | 5.0.4   | 5.0.6    | 5.0.6       |
| react-intersection-observer     | 9.16.0  | 9.16.0   | **10.0.3**  |
| react-markdown                  | 9.1.0   | 9.1.0    | **10.1.0**  |
| react-syntax-highlighter        | 16.1.0  | 16.1.1   | 16.1.1      |
| react-toastify                  | 10.0.6  | 10.0.6   | **11.1.0**  |
| resend                          | 6.12.2  | 6.12.3   | 6.12.3      |
| slugify                         | 1.6.6   | 1.6.9    | 1.6.9       |
| tailwindcss                     | 4.1.18  | 4.3.0    | 4.3.0       |
| three                           | 0.182.0 | 0.182.0  | **0.184.0** |
| tsx                             | 4.21.0  | 4.22.0   | 4.22.0      |
| undici                          | 7.21.0  | 7.25.0   | **8.3.0**   |
| uuid                            | 13.0.0  | 13.0.2   | **14.0.0**  |

Bold = major-version gap exists. `.github/dependabot.yml` ignores major updates ("review manually") and groups minor+patch updates into prod/dev bundles, weekly Monday.

### 11. Security vulnerabilities (`npm audit --json`)

**Totals:** critical 1, high 22, moderate 6, low 4, info 0 — **33 total**.

Top advisories (severity | direct package | underlying advisory):

- **critical** | `fast-xml-parser` | DOCTYPE entity bypass / DoS via entity expansion / XMLBuilder stack overflow / numeric entity bypass / falsy zero-step bypass / XMLBuilder comment+CDATA injection (multiple CVEs)
- high | `@opentelemetry/sdk-node` and all `@opentelemetry/exporter-{logs,metrics,trace}-otlp-{grpc,http,proto}` packages, `@opentelemetry/otlp-{exporter-base,grpc-exporter-base,transformer}` | rooted at `protobufjs`
- high | `@opentelemetry/auto-instrumentations-node` | rolls up the OTel exporter chain
- moderate | `@aws-sdk/xml-builder` | `fast-xml-parser`
- moderate | `@vercel/blob` | `undici`
- moderate | `ajv` | ReDoS when using `$data`
- moderate | `brace-expansion` | Zero-step sequence DoS
- low | `@tootallnate/once` | Incorrect Control Flow Scoping

The OpenTelemetry cluster is transitive — likely arrives via `langfuse` or `inngest`.

### 12. Duplicate dependencies

`npm ls --all 2>&1 | grep -c deduped` → **1981 deduped** entries (npm successfully shared these across the dependency graph).

### 13. Likely unused dependencies (zero source-file import matches)

Search method: `grep` for `'<pkg>'` and `"<pkg>"` (with optional sub-path) across `**/*.{ts,tsx,js,jsx}` excluding `node_modules/.next/coverage/test-results/playwright-report/__mocks__`.

**Production deps with 0 source hits:**
| Package | Likely status |
|---|---|
| `@ai-sdk/amazon-bedrock` | Zero hits (may load via `ai` package internals) |
| `@ai-sdk/react` | Zero hits |
| `@vercel/kv` | Zero hits |
| `cheerio` | Zero hits (no HTML scraping found) |
| `openai` | Zero hits (codebase uses Bedrock client instead) |
| `prisma` | CLI-only (used via `prisma generate`/`migrate` scripts) |
| `prismjs` | Zero hits (`remark-prism` peer dep likely) |
| `react-dom` | Framework-implicit (Next.js auto-imports) |
| `react-intersection-observer` | Zero hits |
| `react-syntax-highlighter` | Zero hits |
| `remark-prism` | Zero hits in current source (may have been removed) |
| `uuid` | Zero hits |

**Single-hit / suspicious-low-usage prod deps** (1 hit):
`@react-three/drei`, `@upstash/ratelimit`, `@upstash/redis`, `langfuse`, `marked`, `resend` — most appear in their respective `lib/` wrapper modules (dynamic-import-only).

**Dev deps with 0–2 source hits** (most are tooling-implicit and not imported directly):
`@eslint/eslintrc` (2), `@eslint/js` (2), `@types/bcryptjs` (2), `autoprefixer` (2), `eslint` (2), `jest-environment-jsdom` (2), `postcss` (2), `tailwindcss` (2). All framework-implicit.

### 14. Largest installed dependencies by disk

```
151M  node_modules/next
124M  node_modules/@next
 45M  node_modules/@prisma
 45M  node_modules/@opentelemetry
 38M  node_modules/date-fns           (transitive — not in package.json)
 37M  node_modules/three
 29M  node_modules/three-stdlib       (transitive)
 29M  node_modules/stats-gl           (transitive)
 27M  node_modules/prisma
 24M  node_modules/hls.js             (transitive)
 23M  node_modules/typescript
 19M  node_modules/@mediapipe          (transitive — @react-three/drei)
 16M  node_modules/@img
 13M  node_modules/@testing-library
 12M  node_modules/openai
 11M  node_modules/inngest
 11M  node_modules/@babel
 10M  node_modules/es-abstract
 9.9M node_modules/@esbuild
 8.9M node_modules/@types
```

---

## Section 3: Code Quality & Static Analysis

### 15. ESLint config

- **File:** `eslint.config.mjs` (ESLint flat config, ESM)
- **ESLint:** ^9.39.2 (installed 9.39.2)
- **Extends:** spreads `nextConfig` from `eslint-config-next` ^16.1.1
- **Custom ignores** (extends Next.js defaults): `node_modules`, `.next`, `out`, `coverage`, `playwright-report`, `test-results`, `e2e/visual.spec.ts-snapshots`, `__mocks__`, `__fixtures__`, `__tests__`, `e2e/**`, `test-utils.jsx`, `*.config.js`, `*.config.mjs`, `jest.polyfills.js`, `jest.setup.js`
- **JS/JSX rule overrides:**
  - `react/no-unescaped-entities`: off
  - `react-hooks/exhaustive-deps`: warn
  - `react-hooks/set-state-in-effect`: off (React Compiler rule disabled)
  - `react-hooks/immutability`: off (disabled)
  - `react-hooks/preserve-manual-memoization`: off (disabled)
  - `import/no-anonymous-default-export`: off
  - `no-unused-vars`: warn with `^_` ignore for args/vars/caught errors
  - `no-console`: off
- **TS/TSX rule overrides:** `no-unused-vars`: off
- Jest globals injected for JS/JSX files

### 16. Prettier

- **Not configured.**
- No `.prettierrc`, `.prettierrc.*`, `prettier.config.*`, `.editorconfig`.
- No `"prettier"` key in `package.json`.
- CI step in `test.yml` runs `npx prettier --check` conditionally only if `grep -q "prettier" package.json` succeeds — currently skipped.

### 17. TypeScript config (`tsconfig.json`)

```json
{
  "target": "ES2017",
  "lib": ["dom", "dom.iterable", "esnext"],
  "skipLibCheck": true,
  "strict": true,
  "noEmit": true,
  "esModuleInterop": true,
  "module": "esnext",
  "moduleResolution": "bundler",
  "resolveJsonModule": true,
  "isolatedModules": true,
  "jsx": "preserve",
  "incremental": true,
  "paths": { "@/*": ["./*"] },
  "allowJs": true
}
```

Highlight table:
| Flag | Value |
|---|---|
| `strict` | true |
| `noImplicitAny` | (implicit via strict) |
| `strictNullChecks` | (implicit via strict) |
| `noUncheckedIndexedAccess` | **NOT set** |
| `target` | ES2017 |
| `moduleResolution` | bundler |
| `allowJs` | true |

Includes: `next-env.d.ts`, `**/*.ts`, `**/*.tsx`. Excludes: `node_modules`. There is no separate include for test files — `__tests__/**/*.ts` IS type-checked even though excluded from ESLint.

### 18. TypeScript errors (`npx tsc --noEmit`)

**Total: 389 errors across 15 files.**

Error-code distribution:
| Code | Count | Meaning |
|---|---|---|
| TS2304 | 250 | `Cannot find name` (jest/expect/describe etc.) |
| TS2582 | 111 | `Cannot find name 'it/describe'. Try @types/jest…` |
| TS2503 | 20 | `Cannot find namespace 'jest'` |
| TS7006 | 3 | Parameter implicitly has 'any' type |
| TS7031 | 2 | Binding element implicitly 'any' |
| TS2305 | 1 | Module has no exported member |
| TS2774 | 1 | Condition always true (function always defined) |
| TS18046 | 1 | `error` is of type `unknown` |

All affected files are under `__tests__/**/*.ts` and `e2e/*.ts`. Root cause: no `@types/jest` in `devDependencies` (Jest types not loaded for TS test files). The `lint:nocheck` script in `package.json` separately enforces zero `@ts-nocheck` in source dirs (`components/`, `pages/`, `lib/`, `middleware.ts`).

**First 10 errors verbatim:**

```
__tests__/api/chat.test.ts(29,20): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(30,1): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(32,26): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(35,1): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(37,24): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(40,1): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(41,20): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(44,1): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(45,16): error TS2304: Cannot find name 'jest'.
__tests__/api/chat.test.ts(59,10): error TS2305: Module '"@/lib/bedrock/client"' has no exported member '__streamMock'.
```

### 19. Lint errors/warnings (`npx eslint . --format json`)

- **Files scanned:** 224
- **Files with issues:** 33
- **Total errors:** 0
- **Total warnings:** 148

Top rule occurrences (`ruleId`):
| Count | Rule |
|---|---|
| 147 | `null` (parser/syntax-only warning — no rule ID attribution from ESLint output) |
| 1 | `import/no-anonymous-default-export` |

The 147 `null`-ruled warnings indicate parser/processor-level messages (e.g. "File ignored because outside of base path") rather than actual rule violations.

### 20. Long files (>300 lines, source + tests + docs)

| Lines | Path                                                       |
| ----- | ---------------------------------------------------------- |
| 1165  | `components/admin/AboutSettingsSection.tsx`                |
| 1114  | `__tests__/components/AboutSettingsSection.test.jsx`       |
| 955   | `styles/globals.css`                                       |
| 736   | `__tests__/api/about/admin-about.test.js`                  |
| 727   | `__tests__/README.md`                                      |
| 671   | `__tests__/components/admin/projects/ProjectForm.test.jsx` |
| 651   | `components/GitHubContributionGraph.tsx`                   |
| 636   | `__mocks__/handlers.js`                                    |
| 614   | `e2e/errors.spec.ts`                                       |
| 579   | `__tests__/api/projects/index.test.js`                     |
| 572   | `e2e/accessibility.spec.ts`                                |
| 561   | `.github/WORKFLOW_SETUP.md`                                |
| 551   | `__tests__/components/HeroSection.test.jsx`                |
| 530   | `__tests__/components/FeaturedProjects.test.jsx`           |
| 518   | `jest.setup.js`                                            |
| 508   | `pages/articles/new.tsx`                                   |
| 489   | `e2e/performance.spec.ts`                                  |
| 484   | `__tests__/components/admin/ImageUploader.test.jsx`        |
| 478   | `README.md`                                                |
| 471   | `__tests__/components/Footer.test.jsx`                     |
| 471   | `__tests__/components/Contact.test.jsx`                    |
| 468   | `e2e/deeplinks.spec.ts`                                    |
| 459   | `pages/admin/articles/[id]/edit.tsx`                       |
| 448   | `__tests__/components/NewArticlePage.test.jsx`             |
| 446   | `.github/TESTING_SUMMARY.md`                               |
| 442   | `__tests__/components/PostComments.test.jsx`               |
| 435   | `__tests__/api/admin/posts-id.test.js`                     |
| 430   | `__fixtures__/api-responses.js`                            |
| 424   | `components/FeaturedProjects.tsx`                          |
| 416   | `__tests__/integration/navigation-flow.test.jsx`           |
| 414   | `pages/admin/articles/new.tsx`                             |
| 413   | `.github/BRANCH_PROTECTION.md`                             |
| 410   | `e2e/visual.spec.ts`                                       |
| 409   | `pages/contact.tsx`                                        |
| 407   | `pages/projects.tsx`                                       |
| 403   | `__tests__/components/SocialLinks.test.jsx`                |
| 403   | `__tests__/components/AboutHero.test.jsx`                  |
| 402   | `__tests__/api/home-content.test.js`                       |
| 400   | `components/admin/projects/ProjectForm.tsx`                |
| 399   | `components/RecentActivity.tsx`                            |

### 21. Long functions/components

Best-effort scan with awk regex on top-level `function`/`const X = …` declarations inside files >300 lines returned no parseable matches (the codebase uses heterogeneous declaration styles — default exports, named exports, arrow components, nested callbacks). **Deferred to manual review.** Candidates by file: `components/admin/AboutSettingsSection.tsx` (1165 LOC, likely contains a single oversized form component); `components/GitHubContributionGraph.tsx` (651 LOC); `pages/articles/new.tsx` (508 LOC); `pages/contact.tsx` (409 LOC); `pages/projects.tsx` (407 LOC).

### 22. Code smell markers

**Source-tree scope: source dirs only** (excludes `__tests__`, `__mocks__`, `e2e`, `node_modules`, `.next`, `coverage`, `scripts/`).

| Smell                                             | Count | Notes                                                                                               |
| ------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `TODO` / `FIXME` / `HACK` / `XXX` / `NOTE:`       | **0** | None.                                                                                               |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **0** | Enforced by `npm run lint:nocheck` script. Recent commit `357d857` removed remaining `@ts-nocheck`. |
| `: any`                                           | 16    | Locations below.                                                                                    |
| `as any`                                          | 2     | `pages/articles/index.tsx:39`, `pages/articles/[topic]/[slug].tsx:57`.                              |
| `console.log` / `.warn` / `.error`                | 98    | Across source (`no-console` is OFF in ESLint).                                                      |
| `eslint-disable` directives                       | 92    | Breakdown below.                                                                                    |

`: any` locations (16):

```
components/GitHubContributionGraph.tsx:326 — .then((module: any) => {
lib/moderation/policy.ts:31 — comment text "Reject: any of …" (false positive)
lib/moderation/policy.ts:37 — comment text "Hold: any of …" (false positive)
pages/projects.tsx:140 — techStack.some((tech: any) => …
pages/projects.tsx:174 — let aVal: any = aRec[sortBy]
pages/projects.tsx:175 — let bVal: any = bRec[sortBy]
pages/about.tsx:27 — technicalSkills?: any[]
pages/about.tsx:28 — professionalExperience?: any[]
pages/about.tsx:29 — education?: any[]
pages/about.tsx:30 — technicalCertifications?: any[]
pages/about.tsx:31 — leadershipExperience?: any[]
pages/about.tsx:33 — professionalDevelopment?: any[]
pages/about.tsx:34 — hobbies?: any[]
pages/about.tsx:41 — contactData: any | null
pages/articles/index.tsx:235 — let recentPosts: any[] = []
pages/articles/[topic]/[slug].tsx:211 — }: any) {  (destructured prop)
```

(2 of these are comment text, not type annotations.)

`eslint-disable` distribution (rules disabled):
| Count | Directive |
|---|---|
| 30 | `eslint-disable react/no-unescaped-entities` |
| 30 | `eslint-disable @typescript-eslint/no-explicit-any` |
| 22 | `eslint-disable-next-line @typescript-eslint/no-explicit-any` |
| 11 | `eslint-disable-next-line @next/next/no-img-element` |
| 9 | `eslint-disable-next-line react-hooks/immutability` |
| 7 | `eslint-disable-next-line react-hooks/set-state-in-effect` |
| 4 | `eslint-disable react-hooks/set-state-in-effect` |
| 1 | `eslint-disable-next-line react-hooks/exhaustive-deps` |
| 1 | `eslint-disable react-hooks/immutability` |

---

## Section 4: Testing

### 23. Test framework

| Tool                        | Version | Role                                               |
| --------------------------- | ------- | -------------------------------------------------- |
| jest                        | ^29.7.0 | Unit / integration runner (testEnvironment: jsdom) |
| jest-environment-jsdom      | ^29.7.0 | DOM env for Jest                                   |
| jest-axe                    | ^10.0.0 | a11y assertions in unit tests                      |
| @testing-library/react      | ^14.3.1 | React component testing                            |
| @testing-library/jest-dom   | ^6.9.1  | Custom DOM matchers                                |
| @testing-library/user-event | ^14.6.1 | User-interaction helpers                           |
| msw                         | ^2.12.7 | API mocking                                        |
| @playwright/test            | ^1.57.0 | E2E                                                |
| @axe-core/playwright        | ^4.11.0 | a11y in E2E                                        |

Config files: `jest.config.js` (uses `next/jest` factory, jsdom, polyfills, alias `@/*` and module mocks for three/@react-three/@prisma/@vercel/@next-auth/etc., coverage thresholds **70%** for statements/branches/functions/lines, ignores `node_modules`, `.next`, `e2e`), `jest.polyfills.js`, `jest.setup.js` (518 lines), `playwright.config.ts` (baseURL `http://localhost:3000`, retries 2 on CI, fullyParallel, html+list reporters).

### 24. Test file counts

| Pattern         | Count |
| --------------- | ----- |
| `*.test.ts`     | 13    |
| `*.test.tsx`    | 0     |
| `*.test.js`     | 72    |
| `*.test.jsx`    | 87    |
| `e2e/*.spec.ts` | 9     |

**Total test files:** 181.
**`jest --listTests`:** 172 suites picked up by Jest (some files are e2e/excluded).
**`jest --coverage` run:** 172 test suites passed, **2823 tests passed**, 5 snapshots passed, runtime 55.57s.

### 25. Coverage (run with `npm run test:coverage` → `jest --coverage`)

Global totals from console output:
| Metric | % | Threshold | Met? |
|---|---|---|---|
| Statements | 67.35 | 70 | **No** |
| Branches | 64.16 | 70 | **No** |
| Lines | 69.18 | 70 | **No** |
| Functions | 64.68 | 70 | **No** |

All four global thresholds failed. Coverage HTML/lcov was written to `coverage/`. Several specific files report 0% (e.g. `pages/api/auth/[...nextauth].ts` — 1-91 uncovered, `pages/design/comp.tsx` — 18-103 uncovered). API routes coverage is generally high (most >90%).

### 26. CI test integration

`.github/workflows/test.yml` (787 lines). Triggers: push to `main`/`develop`, PR to `main`/`develop`, manual dispatch. Concurrency group cancels in-progress runs on the same ref.

Jobs (12, named via job IDs):
| Job | Purpose |
|---|---|
| `lint` | npm install → `npm run lint` → `npm run lint:nocheck` → conditional prettier check |
| `security` | npm install → `npm audit` → Snyk scan (non-blocking) |
| `build` | npm install → `prisma generate` → `next build` |
| `unit-tests` | `jest --coverage` (uses Postgres service; DATABASE_URL injected) |
| `e2e-tests` | Playwright run |
| `e2e-report` | Publish Playwright HTML report |
| `lighthouse` | Lighthouse CI (config in `lighthouserc.json`) |
| `visual-regression` | Playwright `visual.spec.ts` |
| `accessibility` | `e2e/accessibility.spec.ts` |
| `performance` | `e2e/performance.spec.ts` |
| `test-summary` | Aggregates job statuses |

Global env: `NODE_VERSION='20'`, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db`, `NEXTAUTH_SECRET=test-secret-for-ci`, `NEXTAUTH_URL=http://localhost:3000`.

Other workflows:

- `.github/workflows/release.yml` — `googleapis/release-please-action@v4` on push to `main`
- `.github/workflows/stale.yml` — `actions/stale@v9` daily cron (30d → label, +7d → close)
- `.github/dependabot.yml` — weekly Monday npm + GitHub Actions updates; majors ignored; grouped prod/dev minor+patch PRs

---

## Section 5: Performance & Assets

### 27. Images inventory

**Root `public/`:**
| Path | Size | Format |
|---|---|---|
| public/favicon.ico | 4.3 KB | ico |
| public/manifest.json | 641 B | json (PWA manifest) |
| public/sw.js | 1.1 KB | js (service worker) |
| public/.DS_Store | 6 KB | macOS junk (gitignored) |

**`public/images/` (6 files, 459 KB total):**
| Path | Size | Format |
|---|---|---|
| public/images/logo.png | **361 KB** ⚠️ (>300 KB but <500 KB threshold) | png |
| public/images/handshake-logo.png | 64 KB | png |
| public/images/linkedin-logo.png | 9 KB | png |
| public/images/github-logo.png | 8 KB | png |
| public/images/x-logo.png | 8 KB | png |
| public/images/email-logo.png | 5 KB | png |

**`public/uploads/` (367 files, 1.4 MB total) — user-uploaded admin content:**
| Format | Count |
|---|---|
| .jpg | 127 |
| .png | 80 |
| .webp | 40 |
| .gif | 40 |
| .mp4 | 40 |
| .webm | 40 |

No files >500 KB in `public/uploads/`. **Modern formats are in use** (webp and webm present alongside jpg/mp4 — uploaded as resized variants by the admin uploader). Note: `public/uploads/` is gitignored.

**Total `public/` weight:** 1.9 MB.

### 28. Font loading strategy

- **`next/font/google`** (lib/fonts.ts) — 6 families, all `display: "swap"`, `subsets: ["latin"]`, exposed as CSS variables:

| Variable              | Family            | Weights  | Style  |
| --------------------- | ----------------- | -------- | ------ |
| `--font-heading`      | Space Grotesk     | 300–700  | normal |
| `--font-body`         | Plus Jakarta Sans | 300–800  | normal |
| `--font-mono`         | JetBrains Mono    | 400–600  | normal |
| `--font-old-standard` | Old Standard TT   | 400, 700 | italic |
| `--font-bebas`        | Bebas Neue        | 400      | normal |
| `--font-manrope`      | Manrope           | 300–800  | normal |

Legacy aliases re-exported: `roboto` → `plusJakartaSans`, `oswald` → `spaceGrotesk`, `sourceCodePro` → `jetbrainsMono`.

- **No Google Fonts CDN `<link>` tags.**
- **No `@font-face` declarations** in `styles/`.
- No local font files in `public/fonts/`.
- Comment in `lib/fonts.ts` notes: "SUPERNOVA stack still loaded on production routes. Liquid Heat additions … ship below for /design/comp; will graduate to production after the comp lands (session 02 — design tokens refresh)."

### 29. Top 20 largest files in repo (excluding node_modules/.git/.next/dist/build/coverage/.swc/test-results/playwright-report and lockfiles)

| Size | Path                                                              |
| ---- | ----------------------------------------------------------------- |
| 364K | public/images/logo.png                                            |
| 188K | e2e/visual.spec.ts-snapshots/about-desktop-chromium-darwin.png    |
| 168K | e2e/visual.spec.ts-snapshots/about-tablet-chromium-darwin.png     |
| 152K | e2e/visual.spec.ts-snapshots/about-mobile-chromium-darwin.png     |
| 136K | e2e/visual.spec.ts-snapshots/contact-desktop-chromium-darwin.png  |
| 132K | e2e/visual.spec.ts-snapshots/contact-tablet-chromium-darwin.png   |
| 116K | e2e/visual.spec.ts-snapshots/contact-mobile-chromium-darwin.png   |
| 108K | e2e/visual.spec.ts-snapshots/projects-desktop-chromium-darwin.png |
| 100K | e2e/visual.spec.ts-snapshots/projects-tablet-chromium-darwin.png  |
| 92K  | e2e/visual.spec.ts-snapshots/projects-mobile-chromium-darwin.png  |
| 64K  | public/images/handshake-logo.png                                  |
| 60K  | e2e/visual.spec.ts-snapshots/404-page-chromium-darwin.png         |
| 52K  | e2e/visual.spec.ts-snapshots/contact-loading-chromium-darwin.png  |
| 40K  | components/admin/AboutSettingsSection.tsx                         |
| 36K  | **tests**/components/AboutSettingsSection.test.jsx                |
| 28K  | .github/workflows/test.yml                                        |
| 24K  | styles/globals.css                                                |
| 24K  | e2e/errors.spec.ts                                                |
| 24K  | components/GitHubContributionGraph.tsx                            |
| 24K  | **tests**/api/about/admin-about.test.js                           |

### 30. Lazy loading patterns

6 total occurrences across source:
| File:Line | Pattern |
|---|---|
| `components/HeroSection.tsx:47` | `dynamic(() => import("react-typed").then(mod => mod.ReactTyped), ...)` |
| `components/_design/HeroV2.tsx:21` | `dynamic(() => import("./FluidHeatShader"), ...)` |
| `pages/index.tsx:44` | `dynamic(() => import("@/components/GitHubContributionGraph"))` |
| `pages/index.tsx:59` | `dynamic(() => import("@/components/SpaceBackground"))` |
| `components/FeaturedProjects.tsx:254` | `<img loading="lazy" ...>` |
| `components/Project/ProjectCard.tsx:118` | `<img loading="lazy" ...>` |

No `React.lazy(`. No `<Suspense>` boundaries in source.

### 31. Code splitting via `import(...)`

20 occurrences (includes wrappers above + runtime `await import(...)` in lib for side-effect/optional deps):

- `lib/auth.ts:35`, `:37`, `:41`, `:43` — `await import("next-auth/next")`, `await import("../pages/api/auth/[...nextauth]")`, `await import("next-auth/jwt")`, `await import("./config")`
- `lib/utils/rateLimit.ts:26`, `:27` — `await import("@upstash/ratelimit")`, `await import("@upstash/redis")`
- `lib/observability/langfuse.ts:25` — `await import("langfuse")`
- `lib/email/resend.ts:22` — `await import("resend")`
- `components/GitHubContributionGraph.tsx:325` — `import("react-github-calendar")`
- `pages/api/posts/index.ts:88`, `pages/api/posts/[topic]/[slug].ts:71`, `pages/api/articles/index.ts:143`, `pages/api/admin/posts/index.ts:99`, `pages/api/admin/posts/[id].ts:60` — `await import(... calculateReadingTime ...)` (5 sites)
- `scripts/migrate-data.js:245` — `await import(...)` for migration helpers
- `jest.config.js:8` — `import('jest').Config` (type-only)

### 32. CSS strategy

- **Tailwind CSS v4** (`tailwindcss@^4.1.18`) via PostCSS plugin (`@tailwindcss/postcss@^4.1.18`)
  - `postcss.config.mjs`: `{ plugins: { "@tailwindcss/postcss": {} } }`
  - `autoprefixer@^10.4.23` also present
  - CSS-first config: `@import "tailwindcss"` + `@theme { ... }` block in `styles/globals.css` (no separate `tailwind.config.*` file)
- **No CSS Modules** (0 `*.module.css`).
- **No styled-components / Emotion** (deps absent).
- **2 global CSS files**: `styles/globals.css` (955 lines, full Supernova/Liquid Heat token system + utility classes), `styles/toast.css`.
- **Tailwind class usage:** 1,433 occurrences of `className=` across `pages/` and `components/`.

---

## Section 6: SEO & Metadata

### 33. Meta tags inventory

**Global SEO pattern:** All public pages use the centralized `components/SEO.tsx` wrapper component, which injects metadata via `next/head`. Defaults: `title="Josh Lowe"`, `description="Full Stack Developer specializing in modern web technologies."`, `image="/images/logo.png"`, `url="https://jlowe.ai"`, `type="website"`. Auto-appends `" | Josh Lowe"` to titles. Renders OG (`og:type`, `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name="Josh Lowe"`), Twitter Card (`twitter:card="summary_large_image"`, etc.), canonical link, and `robots="index, follow"`. `_app.tsx` and `_document.tsx` add only `theme-color`, manifest link, and `apple-mobile-web-app-capable`. Admin and `/design/*` pages bypass `SEO` entirely; `/design/*` renders bare with `robots="noindex,nofollow"`.

| URL                        | Title                                     | Description                                                                         | OG image                            | Notable                                                                          |
| -------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `/`                        | "Josh Lowe – AI/ML Engineer \| Portfolio" | from `welcomeData.briefBio` (dynamic)                                               | default `/images/logo.png`          | no `url`/`type` override                                                         |
| `/about`                   | "About Me" (or `ownerName`)               | "Learn more about my experience and skills"                                         | default                             | `url="https://jlowe.ai/about"`, `type="profile"`; two SEO calls (loading + main) |
| `/contact`                 | "Contact – Josh Lowe"                     | "Get in touch with Josh Lowe for AI consulting and engineering projects"            | default                             | `url="https://jlowe.ai/contact"`; description varies between loading and main    |
| `/projects`                | "Projects – Josh Lowe"                    | "Explore my portfolio of AI, machine learning, and full-stack development projects" | default                             | no explicit `url`/`type`                                                         |
| `/articles`                | "Articles – Josh Lowe"                    | "Read my latest articles on web development…"                                       | default                             | `url="https://jlowe.ai/articles"`                                                |
| `/articles/[topic]/[slug]` | `post.metaTitle \|\| post.title`          | `post.metaDescription \|\| post.description`                                        | `post.ogImage \|\| post.coverImage` | dynamic from Prisma `Post`; `url=https://jlowe.ai/articles/{topic}/{slug}`       |
| `/projects/[slug]`         | `project.title`                           | `project.shortDescription \|\| project.description`                                 | `project.images[0]` if present      | dynamic from Prisma `Project`; 404 → "Project Not Found"                         |
| `/admin/*`                 | "Admin – Josh Lowe"                       | n/a                                                                                 | n/a                                 | no SEO component; bare layout with `ToastProvider`                               |
| `/design/*`                | "Design preview — jlowe.ai"               | n/a                                                                                 | n/a                                 | no SEO; `robots="noindex,nofollow"`                                              |

### 34. Sitemap

- No `sitemap.xml` file in `public/` or elsewhere.
- No `next-sitemap` / `@astrojs/sitemap` / other generator dep.
- **No sitemap.**

### 35. `robots.txt`

- **MISSING** from `public/`. (Project relies on per-page `meta robots` tag set by the `SEO` component.)

### 36. Structured data (`application/ld+json`)

- **Zero source-tree matches.** The only file referencing `application/ld+json` is `e2e/seo.spec.ts` (a Playwright assertion). No JSON-LD schema is emitted by the site. Schema.org `@type` strings: none found in source.

### 37. Favicon set

Files present in `public/`:
| File | Size |
|---|---|
| favicon.ico | 4.3 KB |
| manifest.json | 641 B (PWA manifest) |

**Missing from a complete favicon set:** `apple-touch-icon.png`, `apple-touch-icon-precomposed.png`, named-size PNGs (`icon-192.png`, `icon-512.png`, `favicon-16x16.png`, `favicon-32x32.png`), `safari-pinned-tab.svg`, `browserconfig.xml`. Only `favicon.ico` + `manifest.json` (typical bare minimum).

---

## Section 7: Accessibility

### 38. Semantic HTML density (occurrences across `pages/` + `components/`)

| Tag                   | Count  |
| --------------------- | ------ |
| `<div`                | 570    |
| `<span`               | 122    |
| `<h2`                 | 35     |
| `<h3`                 | 20     |
| `<h1`                 | 12     |
| `<section`            | 9      |
| `<nav`                | 3      |
| `<header`             | 3      |
| `<article`            | 3      |
| `<button`             | 3      |
| `<main`               | 1      |
| `<aside`              | 1      |
| `<footer`             | 0      |
| `<h4` / `<h5` / `<h6` | 0 each |

Note: `<button>` count is 3 because the codebase uses a `Button` (custom primitive) component for most interactions; `<footer>` is 0 because the `Footer.tsx` component renders a generic `<div>` or its content is wrapped at the page level. Headings ≥ h4 are unused.

### 39. Alt-text coverage

- Total `<img` or `<Image` occurrences in `pages/` + `components/`: **21**
- Lines that BOTH open an `<img` / `<Image` AND contain `alt=` on the same line: **0**

This grep is line-bounded, so multi-line `<Image ... alt="..." />` is undercounted. **The "0 with alt=" figure is a regex artefact, not a confirmed absence of alt attributes.** Manual review needed. Files containing `<img` or `<Image` (12 files):

```
pages/contact.tsx                                   (1)
pages/articles/index.tsx                            (1)
pages/articles/[topic]/[slug].tsx                   (2)
components/SocialLinks.tsx                          (4)
components/Footer.tsx                               (2)
components/FeaturedProjects.tsx                     (1)
components/Header.tsx                               (1)
components/admin/ImageUploader.tsx                  (1)
components/admin/shared/MediaUpload.tsx             (1)
components/About/AboutHero/AboutHero.tsx            (4)
components/Project/ProjectDetail.tsx                (2)
components/Project/ProjectCard.tsx                  (1)
```

### 40. ARIA usage

**`aria-*` attributes** (10 distinct attributes, 63 total occurrences):
| Count | Attribute |
|---|---|
| 42 | `aria-label` |
| 9 | `aria-hidden` |
| 4 | `aria-labelledby` |
| 2 | `aria-expanded` |
| 1 | `aria-valuenow` |
| 1 | `aria-valuemin` |
| 1 | `aria-valuemax` |
| 1 | `aria-modal` |
| 1 | `aria-live` |
| 1 | `aria-atomic` |

**Explicit `role="..."`** (4 distinct roles, 7 total):
| Count | Role |
|---|---|
| 3 | `role="article"` |
| 2 | `role="dialog"` |
| 1 | `role="progressbar"` |
| 1 | `role="main"` |

---

## Section 8: Design System & Styling

### 41. Color tokens (from `@theme { … }` in `styles/globals.css`)

**Supernova palette (~50 named CSS variables):**

Primary — Deep Ember

```
--color-primary           #e85d04
--color-primary-dark      #c04a03
--color-primary-light     #f48c06
--color-primary-glow      rgba(232, 93, 4, 0.4)
```

Secondary — True Crimson

```
--color-secondary         #9d0208
--color-secondary-dark    #6a040f
--color-secondary-light   #dc2626
```

Accent — Warm Gold

```
--color-accent            #faa307
--color-accent-dark       #e09000
--color-accent-light      #ffba08
```

Tertiary — Dying Ember

```
--color-ember             #f48c06
--color-ember-dark        #e85d04
--color-ember-light       #ffba08
```

Cool — Nebula Blue

```
--color-cool              #4cc9f0
--color-cool-dark         #4895ef
--color-cool-light        #72efdd
```

Fuchsia — Supernova Core

```
--color-fuchsia           #f72585
--color-fuchsia-dark      #b5179e
--color-fuchsia-light     #ff69b4
```

Neutral — Abyss Black

```
--color-bg-space          #000000
--color-bg-dark           #000000
--color-bg-darker         #000000
--color-bg-card           rgba(12, 12, 12, 0.9)
--color-bg-card-solid     #0c0c0c
--color-bg-card-hover     rgba(20, 20, 20, 0.95)
--color-bg-glass          rgba(255, 255, 255, 0.02)
--color-surface           #080808
--color-surface-elevated  #121212
```

Text — Starlight

```
--color-text-primary      #fafafa
--color-text-secondary    #a3a3a3
--color-text-muted        #8a8a8a   /* annotated: "WCAG AA: 5.5:1 contrast on black" */
--color-text-accent       #e85d04
```

Borders

```
--color-border            rgba(232, 93, 4, 0.12)
--color-border-light      rgba(250, 163, 7, 0.2)
--color-border-glow       rgba(232, 93, 4, 0.4)
```

Status

```
--color-success           #10b981
--color-warning           #faa307
--color-error             #ef4444
--color-info              #4cc9f0
```

**Liquid Heat additive palette** (newer; comp-scoped):

```
--color-heat-peak         #ff7300    /* Hero, peak fusion */
--color-heat-bright       #ff1744    /* Hero, bleeding center */
--color-heat-mid          #c42010    /* Mid-page transition */
--color-cooling-end       #1a0306    /* Oxblood */
--color-inflection        #f72585    /* Fuchsia at moments of stress */
--color-stillness         #faa307    /* Gold, moments of pause */
--color-ember-decay       #6a040f    /* Where glows fade out */
--color-drop-cap          #9d0208    /* Crimson drop caps */
```

Section-scoped overrides (lines 741+ override `--color-primary` etc. inside specific selectors for "cooling" sections).

### 42. Typography system

**Font families** (6 via `next/font/google` — see Section 28):
| CSS var | Family |
|---|---|
| `--font-heading` | Space Grotesk |
| `--font-body` | Plus Jakarta Sans |
| `--font-mono` | JetBrains Mono |
| `--font-old-standard` | Old Standard TT (italic) |
| `--font-bebas` | Bebas Neue |
| `--font-manrope` | Manrope |

**Active stacks** (in `@theme`):

```
--font-family-base           = var(--font-body), "Plus Jakarta Sans", system-ui, …
--font-family-heading        = var(--font-heading), "Space Grotesk", system-ui, sans-serif
--font-family-mono           = var(--font-mono), "JetBrains Mono", "Fira Code", monospace
--font-family-display-italic = var(--font-old-standard), "Old Standard TT", "Cormorant Garamond", Georgia, serif
--font-family-condensed      = var(--font-bebas), "Bebas Neue", "Oswald", "Arial Narrow", sans-serif
--font-family-body-neutral   = var(--font-manrope), "Manrope", system-ui, …
```

**Font weights:** Space Grotesk 300–700; Plus Jakarta 300–800; JetBrains Mono 400–600; Old Standard TT 400/700; Bebas Neue 400; Manrope 300–800.
**Custom font sizes** (Liquid Heat scale only — base/body sizes inherit Tailwind defaults):

```
--text-folio      clamp(12rem, 28vw, 24rem)     /* project numeral */
--text-display-xl clamp(4rem, 12vw, 9.5rem)     /* hero headline */
--text-pullquote  clamp(2.25rem, 6.5vw, 4.75rem)
```

No explicit `--line-height-*` or `--font-weight-*` tokens defined.

### 43. Component library / UI primitives

**Stack:** Custom Tailwind v4 + CSS-variable theming. **No external UI library detected** (no Radix UI, shadcn/ui, Headless UI, MUI, Chakra, daisyUI imports).

**Top-level `components/` (16 files):**

- `ErrorBoundary.tsx` — React error boundary wrapper
- `FeaturedProjects.tsx` — Featured projects landing section (424 lines)
- `Footer.tsx` — Site footer with brand, social links, settings
- `GitHubActivity.tsx` — GitHub recent activity feed
- `GitHubContributionGraph.tsx` — GitHub contribution graph (651 lines; uses `react-github-calendar`)
- `Header.tsx` — Site nav with glass morphism and scroll transitions
- `HeroSection.tsx` — Landing hero (react-typed + GSAP)
- `RecentActivity.tsx` — Recent activity timeline (399 lines)
- `RecentResources.tsx` — Resource listing
- `SEO.tsx` — Metadata wrapper (per Section 33)
- `SocialLinks.tsx` — Social icons cluster

**`components/ui/`** (6 primitives):

- `Button.tsx` — variants (primary/secondary/cool/ghost), sizes sm/md/lg/xl, magnetic hover, loading, icon support
- `Card.tsx` — variants, padding options, 3D tilt, glow
- `Badge.tsx` — 10 variants, pulse animation, icon, 3 sizes
- `Pagination.tsx` — prev/next pagination
- `ScrollProgress.tsx` — scroll-progress bar
- `MarkdownContent.tsx` — markdown renderer
- `index.ts` — barrel exports

**`components/Chat/`:** `ChatWidget.tsx`, `ChatPanel.tsx`, `ChatMessage.tsx`, `types.ts`, `index.ts`

**`components/Project/`:** `Project.tsx`, `ProjectCard.tsx`, `ProjectDescription.tsx`, `ProjectDetail.tsx`, `ProjectFilters.tsx`, `ProjectHeader.tsx`, `ProjectSkeleton.tsx`, `ProjectTeam.tsx`, `ProjectTechStack.tsx`, `ProjectTimeline.tsx`, `ProjectsEmptyState.tsx`, `StatusBadge.tsx`, `types.ts`, `index.ts`

**`components/SpaceBackground/`:** `CameraController.tsx`, `CosmicStarfield.tsx`, `ReducedMotionFallback.tsx`, `SupernovaFlash.tsx`, `constants.ts`, `index.tsx`, `shaders.ts`, `starColors.ts`

**`components/_design/`** (Liquid Heat WIP for `/design/comp`): `FluidHeatShader.tsx`, `HeroV2.tsx`, `IgnitionText.tsx`, `ProjectDetailV2.tsx`

**`components/admin/`:** `AboutSettingsSection.tsx` (1165 lines), `AdminLayout.tsx`, `AdminSidebar.tsx`, `BulkActionsToolbar.tsx`, `ContactSettingsSection.tsx`, `DateRangePicker.tsx`, `GlobalSettingsSection.tsx`, `HomeSettingsSection.tsx`, `ImageUploader.tsx`, `KeyboardShortcutsHelp.tsx`, `MarkdownEditor.tsx`, `ProjectPreview.tsx`, `ProjectsSettingsSection.tsx`, `SkeletonLoader.tsx`, `TeamMemberManager.tsx`, `ToastProvider.tsx`, plus subdirs `home/`, `projects/`, `shared/`, hooks `useAutosave.ts`, `useFormValidation.ts`

**`components/About/`** (subdirs only): `AboutHero/`, `CertificationCard/`, `Education/`, `Hobbies/`, `LeadershipExperience/`, `ProfessionalDevelopment/`, `ProfessionalExperience/`, `ProfessionalSummary/`, `TableOfContents/`, `TechnicalCertifications/`, `TechnicalSkills/`

**`components/Articles/`:** `NewsletterSubscription.tsx`, `PostComments.tsx`, `PostLikeButton.tsx`, `SocialShare.tsx`

**`components/icons/`:** `ServiceIcons.tsx`, `index.ts`

**Animation / motion deps:** `gsap` (^3.14.2), `react-typed` (^2.0.12), `react-text-transition` (^3.1.0). No Framer Motion.

### 44. Responsive breakpoints

**From `@media (min-width: Xpx)` declarations in CSS** (only 2 unique):

- 640px
- 1024px

**Tailwind v4 default breakpoints** (available via utility classes even without explicit `@theme` overrides): `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`. There is no Tailwind `--breakpoint-*` override in `@theme`, so defaults apply.

`--container-*` tokens are declared in `@theme` mirroring breakpoint widths: `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.

---

## Section 9: DevOps & Deployment

### 45. CI/CD config

Files in `.github/workflows/`:
| File | Lines | Trigger | Purpose |
|---|---|---|---|
| `test.yml` | 787 | push main/develop, PR main/develop, manual | Full test pipeline (12 jobs — see Section 26) |
| `release.yml` | 36 | push main | `googleapis/release-please-action@v4` (release-please bot) |
| `stale.yml` | 50 | daily cron (`0 0 * * *`), manual | `actions/stale@v9` — 30d → label stale, +7d → close; exempts `pinned/security/bug/enhancement` |

Other `.github/` config:

- `dependabot.yml` — weekly Monday updates for npm + github-actions ecosystems; major versions ignored; prod/dev deps grouped
- Documentation: `BRANCH_PROTECTION.md`, `QUICK_REFERENCE.md`, `TESTING_SUMMARY.md`, `WORKFLOW_SETUP.md`

### 46. Deployment platform indicators

- **`vercel.json`** present — declares one Vercel cron:
  ```json
  { "crons": [{ "path": "/api/cron/qualified-leads-digest", "schedule": "0 12 * * *" }] }
  ```
- No `netlify.toml`, `wrangler.toml`, `fly.toml`, `Dockerfile`, `render.yaml`, `app.yaml`.
- Target: **Vercel**.

### 47. Environment variables referenced in source

30 unique `process.env.*` names found across `**/*.{ts,tsx,js,jsx}` (excluding tests, node_modules, build artifacts):

```
ADMIN_EMAIL                  CALCOM_USERNAME              MONGODB_URL
ADMIN_PASSWORD               CI                           NEXTAUTH_SECRET
AWS_ACCESS_KEY_ID            COHERE_API_KEY               NEXTAUTH_URL
AWS_REGION                   CRON_SECRET                  NODE_ENV
AWS_SECRET_ACCESS_KEY        DATABASE_URL                 OWNER_EMAIL
CALCOM_EVENT_TYPE_SLUG       INNGEST_EVENT_KEY            PRISMA_DATABASE_URL
                             INNGEST_SIGNING_KEY          PRISMA_LOG_QUERIES
                             LANGFUSE_HOST                RESEND_API_KEY
                             LANGFUSE_PUBLIC_KEY          RESEND_FROM_EMAIL
                             LANGFUSE_SECRET_KEY          SKIP_VISUAL_TESTS
                             MONGODB_URI                  UPSTASH_REDIS_REST_TOKEN
                                                          UPSTASH_REDIS_REST_URL
                                                          VERCEL_URL
```

**No `.env.example` file present.** Local `.env` exists (1.4 KB, gitignored). The presence of `MONGODB_URI`/`MONGODB_URL` alongside `DATABASE_URL`/`PRISMA_DATABASE_URL` suggests a partial migration from MongoDB → Prisma/Postgres (consistent with prior commits and the `MONGODB_URL` env still being referenced somewhere).

### 48. Git hooks

- No `husky`, `lefthook`, `simple-git-hooks` in `package.json`.
- No `.husky/` directory.
- No custom hooks in `.git/hooks/` (only `*.sample` defaults).
- **No git hooks configured.**

---

## Section 10: Content Architecture & Routing

### 49. Content approach

- **No MDX files** (0 `*.mdx`).
- **No headless CMS deps** (none of `sanity`, `contentful`, `notion-client`, `@notionhq/*`, `hygraph` in dependencies).
- **Content lives in a Postgres database, accessed via Prisma** (`@prisma/client@^5.20.0`). Posts and projects are admin-authored via the `/admin` UI. Article body content is stored as Markdown in `Post.content`, rendered with `react-markdown` + `remark-gfm` + `remark-prism` (syntax highlighting).
- **19 Prisma models** in `prisma/schema.prisma`:
  ```
  Welcome           SiteSettings        Like
  About             PageContent         NewsletterSubscription
  Contact           ActivityLog         Comment
  Project           AdminUser           CommentVote
  ProjectTeamMember ChatSession         Playlist
  Post              ChatMessageRow      PlaylistPost
                    KnowledgeChunk
  ```
- Static seed data lives in `scripts/seed-admin.js`, `scripts/seed-content.js`. Migration scripts: `scripts/migrate-data.js`, `scripts/migrate-resources-to-posts.js`.
- RAG infra: `KnowledgeChunk` table populated by `scripts/regenerate-embeddings.ts` for the chat assistant; `lib/rag/{chunker,embed,rerank,rrf,sources,upsert,vector-search}.ts` provide retrieval.
- No content `.json` files driving pages (only configs: `vercel.json`, `lighthouserc.json`, `manifest.json`, `tsconfig.json`, etc.).

### 50. Page/route inventory

#### Public pages

| URL                        | File                                | Description                                                                                            |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/`                        | `pages/index.tsx`                   | Portfolio landing with Three.js space background (dynamic), hero, activity timeline, featured projects |
| `/about`                   | `pages/about.tsx`                   | Professional bio with skills, experience, education, certifications using GSAP animations              |
| `/contact`                 | `pages/contact.tsx`                 | Contact info with space theme, GSAP animations, social links, word carousel (409 lines)                |
| `/projects`                | `pages/projects.tsx`                | Portfolio showcase with filtering, search, sort, and infinite scroll (407 lines)                       |
| `/articles`                | `pages/articles/index.tsx`          | Paginated article list with topic filtering and newsletter subscription                                |
| `/articles/new`            | `pages/articles/new.tsx`            | Auth-required form for creating new articles (508 lines)                                               |
| `/articles/[topic]/[slug]` | `pages/articles/[topic]/[slug].tsx` | Article detail with comments, likes, social share, reading analytics                                   |
| `/projects/[slug]`         | `pages/projects/[slug].tsx`         | Project detail page with SSG and fallback rendering                                                    |
| `/design/comp`             | `pages/design/comp.tsx`             | Internal-only Liquid Heat design comp preview (noindex/nofollow)                                       |

#### Admin pages

| URL                         | File                                 | Description                                    |
| --------------------------- | ------------------------------------ | ---------------------------------------------- |
| `/admin`                    | `pages/admin/index.tsx`              | Redirect to dashboard                          |
| `/admin/login`              | `pages/admin/login.tsx`              | NextAuth credentials login                     |
| `/admin/dashboard`          | `pages/admin/dashboard.tsx`          | Project counts and quick links                 |
| `/admin/articles`           | `pages/admin/articles/index.tsx`     | List articles, edit/delete (paginated)         |
| `/admin/articles/new`       | `pages/admin/articles/new.tsx`       | New article editor                             |
| `/admin/articles/[id]/edit` | `pages/admin/articles/[id]/edit.tsx` | Edit existing article (459 lines)              |
| `/admin/projects`           | `pages/admin/projects/index.tsx`     | Manage projects: import/export/bulk operations |
| `/admin/comments`           | `pages/admin/comments.tsx`           | Moderation queue: held/approved/rejected tabs  |
| `/admin/settings`           | `pages/admin/settings.tsx`           | Global, home, about, contact settings          |

#### API routes

| Path                               | Methods            | File                                       | Description                                                    |
| ---------------------------------- | ------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| `/api/index`                       | —                  | `pages/api/index.ts`                       | API root (health/metadata)                                     |
| `/api/auth/[...nextauth]`          | GET, POST          | `pages/api/auth/[...nextauth].ts`          | NextAuth credentials provider with Prisma sessions             |
| `/api/chat`                        | POST               | `pages/api/chat.ts`                        | RAG chat: streaming responses, citations, meeting-booking tool |
| `/api/chat/feedback`               | POST               | `pages/api/chat/feedback.ts`               | Rate chat responses, log feedback to Langfuse                  |
| `/api/posts`                       | GET, POST          | `pages/api/posts/index.ts`                 | List/create posts (auth required for POST)                     |
| `/api/posts/[topic]/[slug]`        | GET, PUT, DELETE   | `pages/api/posts/[topic]/[slug].ts`        | Single post operations                                         |
| `/api/posts/[topic]/[slug]/like`   | POST               | `.../like.ts`                              | Increment like counter                                         |
| `/api/articles`                    | GET, POST          | `pages/api/articles/index.ts`              | List/create articles                                           |
| `/api/projects`                    | GET, POST          | `pages/api/projects/index.ts`              | List/create projects                                           |
| `/api/projects/[id]`               | GET                | `pages/api/projects/[id].ts`               | Fetch single project with team members                         |
| `/api/admin/projects`              | GET, POST          | `pages/api/admin/projects.ts`              | Admin project CRUD with validation and activity logging        |
| `/api/admin/projects/[id]`         | GET, PATCH, DELETE | `pages/api/admin/projects/[id].ts`         | Single-project admin ops                                       |
| `/api/admin/projects/bulk`         | POST               | `pages/api/admin/projects/bulk.ts`         | Bulk update                                                    |
| `/api/admin/projects/import`       | POST               | `pages/api/admin/projects/import.ts`       | Import from file                                               |
| `/api/admin/projects/export`       | GET                | `pages/api/admin/projects/export.ts`       | Export as CSV                                                  |
| `/api/admin/posts`                 | GET, POST          | `pages/api/admin/posts/index.ts`           | Admin post list/create                                         |
| `/api/admin/posts/[id]`            | GET, PATCH, DELETE | `pages/api/admin/posts/[id].ts`            | Single-post admin ops                                          |
| `/api/admin/comments`              | GET, PATCH         | `pages/api/admin/comments/index.ts`        | Moderation list (keyset paginated by status)                   |
| `/api/admin/comments/[id]`         | GET, PATCH, DELETE | `pages/api/admin/comments/[id].ts`         | Approve/reject/delete, logs activity                           |
| `/api/comments`                    | GET, POST          | `pages/api/comments/index.ts`              | Public comments with rate limiting + moderation                |
| `/api/comments/[id]/vote`          | POST               | `pages/api/comments/[id]/vote.ts`          | Like/dislike comments                                          |
| `/api/contact`                     | GET                | `pages/api/contact/index.ts`               | Public contact info                                            |
| `/api/admin/contact`               | POST               | `pages/api/admin/contact.ts`               | Admin contact settings                                         |
| `/api/newsletter/subscribe`        | POST               | `pages/api/newsletter/subscribe.ts`        | Newsletter signup with rate limit                              |
| `/api/admin/about`                 | GET, POST          | `pages/api/admin/about.ts`                 | About-page content admin                                       |
| `/api/about`                       | GET                | `pages/api/about/index.ts`                 | Public about content                                           |
| `/api/admin/activity-log`          | GET                | `pages/api/admin/activity-log.ts`          | Admin activity log                                             |
| `/api/admin/page-content`          | GET, POST          | `pages/api/admin/page-content.ts`          | Page content admin                                             |
| `/api/admin/site-settings`         | GET, POST          | `pages/api/admin/site-settings.ts`         | Site settings admin                                            |
| `/api/admin/upload`                | POST               | `pages/api/admin/upload.ts`                | File upload handler                                            |
| `/api/admin/welcome`               | GET, POST          | `pages/api/admin/welcome.ts`               | Manage welcome message                                         |
| `/api/site-settings`               | GET                | `pages/api/site-settings.ts`               | Public site settings                                           |
| `/api/welcome`                     | GET                | `pages/api/welcome/index.ts`               | Public welcome message                                         |
| `/api/playlists`                   | GET                | `pages/api/playlists/index.ts`             | Paginated playlists                                            |
| `/api/home-content`                | GET, POST          | `pages/api/home-content.ts`                | Home page content                                              |
| `/api/revalidate`                  | POST               | `pages/api/revalidate.ts`                  | On-demand ISR (auth required)                                  |
| `/api/cron/qualified-leads-digest` | POST               | `pages/api/cron/qualified-leads-digest.ts` | Nightly digest cron (Bearer auth)                              |
| `/api/inngest`                     | POST               | `pages/api/inngest.ts`                     | Inngest webhook handler                                        |

Total routes inventoried: 9 public pages + 9 admin pages + ~37 API routes.

---

## Section 11: Repository Hygiene (bonus)

### Total LOC by extension

| Ext                            | Total lines (all dirs, source + tests + mocks + fixtures) |
| ------------------------------ | --------------------------------------------------------- |
| `.ts`                          | 15,480                                                    |
| `.tsx`                         | 18,206                                                    |
| `.js`                          | 19,808                                                    |
| `.jsx`                         | 21,475                                                    |
| `.css`                         | 994                                                       |
| `.md`                          | 4,294                                                     |
| **Sum (TS+TSX+JS+JSX+CSS+MD)** | **80,257**                                                |

(`cloc` is not installed locally; figures are `wc -l` totals.)

### `.gitignore` (47 entries)

```
.env

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# playwright
/test-results/
/playwright-report/
/playwright/.cache/

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
/prisma/migrations
!prisma/migrations/.gitkeep

# uploads
/public/uploads

# test artifacts (temporary files)
test-upstash.ts

# generated knowledge base (optional - remove if you want to commit)
/data/

# personal planning docs (do not commit)
FUTURE_PLANS.md
/docs/planning/
```

Note: `prisma/migrations` is gitignored — that's unusual (migrations are typically committed). Migration files ARE present on disk in `prisma/migrations/`.

### `README.md`

- **Lines:** 478
- **Section headers** (truncated):
  - `# jlowe.ai`
  - `## Tech Stack`
  - `## Features` (`### Public Site`, `### Admin Panel (/admin)`)
  - `## Analytics` (`### Custom Events`, `### Reading Analytics`, `### Usage`, `### Verification`)
  - `## Quick Start` (`### Prerequisites`, `### Installation`, `### Environment Variables`)
  - `## Project Structure`
  - `## Design System` (`### Theme: Supernova`, `#### Color Palette`, `#### Typography`, `### Animations`)
  - `## Custom Hooks` (`### Example: Reading Analytics`)
  - `## Scripts`

### `LICENSE`

- **Not present.** No `LICENSE`, `LICENSE.md`, `LICENSE.txt`, or `COPYING` file in the repo.

### Last 10 commits

```
d3abd14 feat(comments): replace auto-approval with AI moderation
357d857 refactor(types): remove @ts-nocheck from all source files
43c5e74 feat(chat): convert chat into qualified-lead funnel with meeting booking
a5a74ef feat(rag): migrate to pgvector with hybrid search and reranking
8334cb7 feat(chat): add Langfuse observability and feedback capture
b162d71 feat(security): lock down public POST handlers, add rate limiting and validation
9c07c00 refactor: migrate JS/JSX source to TypeScript
bff6b2b chore: add dependencies for TypeScript migration and feature work
8eae4bc fix: add ImageUploader to ProjectForm for thumbnail uploads
c7da44e fix: format leadership dates as month/year only
```

### Unique authors

- **1** (Josh Lowe, single committer).

### Branches

**Local:**

- `* consolidation/2026-05-07` (current)
- `main`

**Remote:** `origin/main`, plus `origin/claude/optimize-recruitment-website-A1KoP`, `origin/claude/setup-mongodb-nextjs-01HEghek8WPC2kvprt6AfJ77`, `origin/release-please--branches--main--components--jlowe.ai`, and dependabot branches: `dependabot/github_actions/{actions/download-artifact-7, actions/github-script-8, actions/stale-10, codecov/codecov-action-5, treosh/lighthouse-ci-action-12}`.

### Untracked / uncommitted changes

**Modified (20 files):**

```
README.md
__tests__/api/admin/posts-id.test.js
__tests__/pages/_app.test.jsx
lib/config.ts
lib/fonts.ts
lib/rag/sources.ts
package-lock.json
package.json
pages/_app.tsx
pages/api/admin/about.ts
pages/api/admin/contact.ts
pages/api/admin/posts/[id].ts
pages/api/admin/posts/index.ts
pages/api/admin/projects.ts
pages/api/admin/projects/[id].ts
pages/api/admin/projects/bulk.ts
pages/api/admin/projects/import.ts
pages/api/admin/welcome.ts
scripts/generate-embeddings.ts
styles/globals.css
```

**Untracked (7 paths):**

```
__tests__/lib/jobs/
components/_design/
lib/jobs/
lib/rag/upsert.ts
pages/api/inngest.ts
pages/design/
scripts/regenerate-embeddings.ts
verification-2026-05-07/
```

---

## Quick Stats

- **Total source files (excluding `__tests__`, `e2e`, `__mocks__`):** 232
- **Total source files (including tests/mocks/fixtures):** 433
- **Total source LOC** (`.ts`+`.tsx`+`.js`+`.jsx`+`.css`+`.md`, all dirs): **80,257 lines**
- **Total dependencies:** 59 declared (38 production + 21 dev)
- **Outdated:** 47 of 59 declared packages
- **Vulnerabilities:** 33 (1 critical, 22 high, 6 moderate, 4 low)
- **Lint:** 0 errors, 148 warnings (147 parser-attribution)
- **TSC:** 389 errors across 15 test files (jest-globals not typed)
- **Tests:** 172 suites / 2823 tests / 5 snapshots / 55.57s, plus 9 Playwright specs
- **Coverage:** 67.35% stmts, 64.16% branches, 69.18% lines, 64.68% funcs — **none meet the 70% threshold**
- **Production build output:** **Build not run** (the `build` script invokes `prisma generate && next build`, which mutates Prisma generated client and `.next/` artifacts; the audit prompt's escape clause was applied). Stale `.next/` from a prior local build is **306 MB**.
- **Notable factual observation:** the repo has a 787-line GitHub Actions test pipeline with 12 jobs (lint, security, build, unit, e2e, lighthouse, visual, accessibility, performance, e2e-report, test-summary) and 2823 passing unit/integration tests — but **no LICENSE file**, no `robots.txt`, no `sitemap.xml`, no JSON-LD structured data, and no `.env.example`. The site is also currently on a non-`main` branch (`consolidation/2026-05-07`) with 20 modified + 7 untracked paths, a single committer (Josh Lowe), and `prisma/migrations` is `.gitignore`d despite migration files being present on disk.
