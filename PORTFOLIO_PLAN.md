# Portfolio Refactor Plan — jlowe.ai

## Context

The audit (`PORTFOLIO_AUDIT.md`, HEAD `8eae4bc`) finds a well-instrumented 23.6k-LOC Next.js 15 Pages-Router portfolio with a defensible foundation (Prisma CMS, 161 Jest files, 9 Playwright specs on 5 browser profiles, a working admin panel, ISR, motion-aware animations, axe-gated a11y) but a mismatched content layer for the stated "AI/ML engineer" positioning. Specific defects block execution: a public-route `/articles/new` gated only by client-side session (`pages/articles/new.jsx`), a cluster of orphaned components with broken CSS-module imports (`components/SocialLinks.jsx`, `RecentResources.jsx`, `GitHubActivity.jsx`, `components/Project/{Project,ProjectDescription,ProjectTeam,ProjectTimeline,ProjectHeader,ProjectTechStack}.jsx`), canonical URLs that collapse to the root on `/projects` and `/projects/[slug]`, no sitemap/robots/JSON-LD, a heavy `three` + `@react-three/fiber` + `@react-three/drei` hero that signals creative-developer branding, four dead markdown/highlighter packages (`marked`, `remark-prism`, `react-syntax-highlighter`, `prismjs`) installed but not imported anywhere, and a blog `TOPIC_OPTIONS` enum with zero ML categories. Goal: ship the portfolio that hiring managers evaluating AI/ML engineering competence (Leidos-style roles, research collaborators, Kronyx/BidOps founder credibility) would recognize as such — without a rebuild.

---

## 1. Verdict

**Refactor, not rebuild — confirmed.** The codebase has three assets rebuilds typically destroy: a working Prisma-backed admin CMS (saves weeks of content authoring), a motion/a11y scaffolding that already respects `prefers-reduced-motion` with axe gating in CI (saves re-solving the problem), and a test suite comprehensive enough to catch regressions during the refactor (161 Jest + 9 Playwright specs across 5 browser profiles). Starting fresh would trade all three for a clean `git log` — a bad deal when the content layer, not the framework, is the actual bottleneck. The orphan cluster, dead deps, and SEO bugs are mechanical fixes, not symptoms of architectural rot; the major-version drift is real but tractable in one coordinated PR because dependabot has been pruning minors continuously. Push back only if the maintainer wants to migrate to a TypeScript-first stack — this repo is JS-native and the conversion cost exceeds the benefit for a single-maintainer portfolio.

---

## 2. Target stack for 2026

| Layer | Decision | Rationale |
| ----- | -------- | --------- |
| **Framework** | **Stay on Next.js Pages Router; upgrade to Next 16.** | The audit's SEO blockers (sitemap, robots, canonical, OG images, JSON-LD) all have clean Pages Router solutions — `pages/sitemap.xml.js`, `public/robots.txt`, SEO.jsx extension, `pages/api/og.js` with `@vercel/og`. App Router's wins (file-based metadata, Server Components, streaming) are real but mostly pay off when the bottleneck is rendering cost or SSR ergonomics — neither applies at this scale. Migration cost: ~40–60 engineering hours with risk of regression across 19 routes + 43 API routes, all of which have established Pages patterns and tests. **Argument for App Router:** the Metadata API would retire SEO.jsx entirely; `app/sitemap.ts`/`app/robots.ts`/`app/opengraph-image.tsx` are first-class; React 19 Server Components let `pages/index.jsx` drop its `getStaticProps` + `dynamic(ssr:false)` boilerplate. **Counter:** every component that uses GSAP or R3F (14 files) becomes `"use client"`, so the actual RSC-only surface is small; Pages Router is supported indefinitely in Next 16; the SEO fixes are one-week work in either router. **Call:** stay on Pages Router for this refactor cycle. Revisit App Router as a dedicated effort after content ships and measurement shows rendering cost is actually hurting. |
| **React** | **React 19.** | Pairs with Next 16. Upgrade is mostly mechanical; React Compiler stays opt-out (ESLint rules in `eslint.config.mjs` already disable the compiler lint checks). The `@testing-library/react` bump from 14 → 16 is forced by this; jest-dom / user-event are compatible. |
| **ORM** | **Prisma 6, not Drizzle.** | At ~15 models and CRUD-shaped queries, Drizzle's wins (zero-runtime SQL, schema-in-TS, lighter bundle) don't apply. Migration cost would be: rewrite `prisma/schema.prisma`, rewrite ~40 query sites, rewrite `scripts/seed-*`, lose `prisma studio`, redo `lib/prisma.js` client. Prisma 6 is a drop-in with better types. Revisit Drizzle only if the app grows a second service or a heavy query surface. |
| **Auth** | **Upgrade to Auth.js 5 (`next-auth@5`).** | `next-auth@4` is in maintenance. Upgrade is moderate on Pages Router — the provider config moves out of `pages/api/auth/[...nextauth].js` into an `auth.ts` module that's imported by both the route handler and `middleware.js`. JWT strategy and credentials provider are unchanged. Do it inside the coordinated major-version PR so the Next/React/Auth surface settles together. |
| **UI primitives** | **Adopt shadcn/ui incrementally, starting with the admin gaps.** | The existing `components/ui/*` primitives (Button/Card/Badge/Pagination/MarkdownContent) are used in ≤5 files outside their own directory and lack Radix underneath — the admin panel fakes dialogs with bare `<div role="dialog">`, has no a11y-correct dropdown menu or combobox, and leans on `react-toastify` where a Radix Toast would compose better. shadcn gives code-you-own components with Radix a11y + Tailwind styling — no new runtime dep, fits the existing "own the code" posture. Start with Dialog / DropdownMenu / Select / Toast / Combobox for the admin; don't retrofit Button/Card/Badge unless touching the file for another reason. Low-priority — ship content first. |
| **Hero / 3D** | **Remove R3F entirely. Keep GSAP for now.** | `three` + `@react-three/fiber` + `@react-three/drei` is ~700 KB shipped only for `components/SpaceBackground/*` (the supernova animation). The AI/ML positioning makes the problem sharper: a supernova hero signals creative developer, not applied-ML engineer. Replace with a lightweight canvas or SVG animation themed to the work — e.g., a token-stream/embedding-scatter visual drawn with vanilla canvas (~5–10 KB) — or a static gradient + the existing typing animation. Keep GSAP (60 KB, 14 call-sites, cost/value is acceptable); prune ScrollTrigger usage opportunistically but don't force a separate PR. |
| **Markdown / highlighter** | **`react-markdown` + `remark-gfm` + `rehype-pretty-code` (backed by `shiki`). Delete the other four.** | Per Explore: only `react-markdown@9` + `remark-gfm@4` are actually imported; `marked@13`, `remark-prism@1.3.6`, `react-syntax-highlighter@16`, and `prismjs@1.29` are installed but zero import sites. Current code blocks render as unstyled `<pre>`. `rehype-pretty-code` (built on Shiki / VS Code grammars) produces themed HTML with negligible runtime cost, integrates as a rehype plugin into the existing `react-markdown` pipeline, and carries the same theming forward into MDX case studies. Net: 4 deps removed, 2 added, syntax highlighting actually works. |

---

## 3. PR sequence (11 PRs, dependency order)

Effort key: **S** ≤ 3 h, **M** ≤ 1 day, **L** ≤ 3 days.

### PR #1 — [P0] Lock down `/articles/new` (S)

**Goal.** Close the public article-creation route. No UI links to it (Explore confirmed), but the URL is discoverable and the only gate is a client-side `useSession` → redirect in `useEffect`, which runs after render — an unauth user sees the form briefly and the submit handler is client-side reachable. Keep the admin-gated equivalent at `pages/admin/articles/new.jsx`.

**Files.** Delete `pages/articles/new.jsx` (485 LOC). Add a one-line Next.js redirect in `next.config.mjs` → `pages/admin/articles/new` (returning 301). Verify `middleware.js` matcher still covers `/admin/:path*`. Delete e2e tests referencing `/articles/new` if any (grep `e2e/` first).

**Risk.** Low — orphaned route, no user-facing link.

**Acceptance.** `curl -s -o /dev/null -w '%{http_code}' https://site/articles/new` returns 301 to `/admin/articles/new`; unauth hit on the target redirects to `/admin/login`. Playwright `e2e/errors.spec.ts` does not regress.

---

### PR #2 — Dead code + dead deps purge (M)

**Goal.** Remove confirmed-orphan components and the four dead markdown/highlighter packages, plus the font-alias "legacy transition" that never finished.

**Files.**
- Delete `components/SocialLinks.jsx` (and the broken `@/styles/SocialLinks.module.css` import trail).
- Delete `components/RecentResources.jsx` (295 LOC, zero importers).
- Delete `components/GitHubActivity.jsx` (344 LOC; `GitHubContributionGraph.jsx` is the live one).
- Delete `components/Project/Project.jsx`, `ProjectDescription.jsx`, `ProjectTeam.jsx`, `ProjectTimeline.jsx`, `ProjectHeader.jsx`, `ProjectTechStack.jsx` — none are imported by any page; `ProjectDetail.jsx` is the live renderer.
- Update `components/Project/index.js` barrel to export only the live primitives (`ProjectCard`, `ProjectFilters`, `ProjectsEmptyState`, `ProjectDetail`, `ProjectSkeleton`, `StatusBadge`).
- Delete `lib/credentials-provider.cjs` (no importers; the actual provider is resolved via `next.config.mjs` webpack `externals` — verify before deletion).
- Remove the three legacy aliases at the bottom of `lib/fonts.js` (`roboto`, `oswald`, `sourceCodePro`). Migrate the 11 call-sites using `font-[family-name:var(--font-oswald)]` in `pages/projects.jsx`, `pages/contact.jsx`, `pages/articles/index.jsx`, `pages/articles/[topic]/[slug].jsx`, `components/Project/ProjectHeader.jsx` to `var(--font-heading)`.
- `package.json`: remove `marked`, `prismjs`, `react-syntax-highlighter`, `remark-prism`.
- Delete the unused `styles/SocialLinks.module.css` / `styles/ProjectsPage.module.css` import references (files don't exist).

**Risk.** Medium — one of the "orphan" files could be loaded dynamically somewhere grep misses. Verify via `npm run build` + full Jest + full Playwright before merge. Run `grep -rn` on each deletion target once more.

**Effort.** M (~4–6 h including test runs).

**Acceptance.** `npm run build` succeeds. `npm test` passes. `npm run test:e2e` passes on chromium. Bundle-size report from CI (`.github/workflows/test.yml` already emits this) shows reduction. `git diff --stat` shows ≥1,500 LOC removed, no functional regressions in manual smoke (home, projects, article detail, admin).

---

### PR #3 — SEO foundation (M)

**Goal.** Ship sitemap, robots, JSON-LD, fix canonicals, fix manifest/theme-color drift.

**Files.**
- Add `pages/sitemap.xml.js` — dynamic route that queries Prisma for all Published `project` slugs and `post` slug/topic pairs, plus the static routes (home, about, projects, articles, contact); emits XML with `res.setHeader('Content-Type', 'application/xml')`.
- Add `public/robots.txt` — `User-agent: *` / `Allow: /` / `Disallow: /admin/` / `Disallow: /api/` / `Sitemap: https://jlowe.ai/sitemap.xml`.
- Extend `components/SEO.jsx`:
  - Accept `path` prop; if set, compute canonical as `${baseUrl}${path}` and drop the hardcoded `url` default.
  - Add optional `jsonLd` prop accepting a structured-data object, render as `<script type="application/ld+json">`.
  - Add `twitter:site` / `twitter:creator` defaults pulled from `lib/config.js`.
- Update all page-level `<SEO />` callers to pass `path={router.asPath}` (or a static path for top-level pages). Critical: `pages/projects.jsx`, `pages/projects/[slug].jsx`, `pages/articles/new.jsx` (being deleted — ignore).
- Add a `components/JsonLd.jsx` helper that emits:
  - `Person` schema on `/about` (name, jobTitle, sameAs links, image, alumniOf, knowsAbout).
  - `WebSite` schema on `/` with SearchAction.
  - `Article` schema on `/articles/[topic]/[slug]` (datePublished, author, image, headline).
  - `SoftwareSourceCode` schema on `/projects/[slug]` (codeRepository from `project.repositoryLink`, programmingLanguage from techStack, description).
  - `BreadcrumbList` on all detail pages.
- `public/manifest.json`: description → "AI/ML Engineer" framing; `theme_color` → `#e85d04` (match `--color-primary`); `background_color` → `#000000` (match `--color-bg-space`).
- `pages/_app.js`: `theme-color` meta → `#e85d04`.

**Risk.** Low. All additive except SEO.jsx interface change (safe — `path` is optional with a fallback).

**Effort.** M (~1 day).

**Acceptance.** `curl https://site/sitemap.xml` returns valid XML. `curl https://site/robots.txt` serves correctly. Google Rich Results Test passes on `/about`, `/projects/[slug]`, `/articles/[topic]/[slug]`. `view-source:` on each page shows correct canonical matching path; no two pages share a canonical.

---

### PR #4 — Per-page OG image generator (S)

**Goal.** 1200×630 branded social cards per page, replacing the 192×192 logo fallback.

**Files.**
- Add `pages/api/og.js` using `@vercel/og` (or `satori` + `@vercel/og`), exporting an Edge-runtime handler that reads `title`, `subtitle`, `type`, `tag` from query params and returns a PNG with the Supernova palette (ember on black) and Space Grotesk.
- Wire `components/SEO.jsx` to default `image` to `/api/og?title=${title}&type=${type}` when caller doesn't pass one.
- Add cache headers (`s-maxage=31536000, immutable`).

**Risk.** Low. Isolated route.

**Effort.** S (~3 h).

**Acceptance.** `/api/og?title=Test` renders a 1200×630 PNG. Twitter Card Validator and LinkedIn Post Inspector show the generated card on `/projects/[slug]` and `/articles/[topic]/[slug]`.

---

### PR #5 — Markdown pipeline: Shiki syntax highlighting (S)

**Goal.** Code blocks actually highlight. Single pipeline, three deps.

**Files.**
- `npm i rehype-pretty-code shiki`.
- Update `components/ui/MarkdownContent.jsx` and `components/admin/MarkdownEditor.jsx` to pass `rehypePlugins={[[rehypePrettyCode, { theme: 'github-dark' }]]}` into `ReactMarkdown`.
- Inline `CodeBlock` component in `pages/articles/[topic]/[slug].jsx` (lines 14–24) is removed — use the default rehype output.
- Add `pre/code` styles to `styles/globals.css` under a new `/* ===== CODE BLOCKS ===== */` section keyed to the Supernova palette.

**Risk.** Low. Previews visually different; run Playwright visual regression before merge.

**Effort.** S (~2–3 h).

**Acceptance.** Blog post renders with a syntax-highlighted fenced code block matching the Supernova theme. Visual regression snapshots updated with reviewer approval. Bundle does not bloat (Shiki is build-time for static blocks, lazy for dynamic).

---

### PR #6 — Prisma schema: AI/ML content fields + admin UI + topic taxonomy (L)

**Goal.** Schema and admin surface that substantiates "I ship AI/ML systems" — evals, benchmarks, model cards, datasets, latency/cost, inference endpoint. This is the single most load-bearing PR for the positioning goal.

**Files.**
- `prisma/schema.prisma`: extend `Project` with
  ```
  modelCards      Json?     // [{ name, baseModel, taskType, inputModalities, outputModalities, trainingData }]
  evalResults     Json?     // [{ benchmark, score, unit, baseline, source }]
  benchmarks      Json?     // [{ metric, value, unit, condition }]
  latencyMs       Int?      // p50 latency
  latencyP99Ms    Int?
  costPerRequest  String?
  costUnit        String?   // "USD / 1M tokens" etc.
  datasets        Json?     // [{ name, sizeRows, license, url }]
  inferenceUrl    String?   // HF Space / Replicate / Modal / replicate
  modelProvider   String?   // "OpenAI" / "Anthropic" / "local" / "custom"
  frameworks      String[]  // ["pytorch", "transformers", "vllm", ...]
  ```
  Extend `Post.topic` enforcement: replace the string column with a sanity-validated input against a new `TOPIC_OPTIONS` list.
- Migration via `npx prisma migrate dev --name ai_ml_fields`.
- `TOPIC_OPTIONS` replacement (single source of truth in `lib/utils/constants.js`, imported by both admin and public): `['llm', 'rag', 'agents', 'evals', 'mlops', 'inference', 'finetuning', 'embeddings', 'systems', 'research', 'tools', 'career']`.
- Admin form extensions in `components/admin/projects/ProjectForm.jsx`:
  - Model Cards repeater (name, base model, task, modalities).
  - Eval Results table (benchmark, score, source).
  - Latency/Cost/Frameworks fields.
  - Datasets repeater.
- New rendering on `/projects/[slug]` in `components/Project/ProjectDetail.jsx`: "Model & Evals" tabbed section showing model card, eval table (with baseline comparison column), latency bar, cost note, framework badge row.
- JSON-LD for `/projects/[slug]` extends to include the new fields as `SoftwareSourceCode` props plus a nested `Dataset` for referenced datasets.

**Risk.** Medium — schema migration touches production DB; admin form is the largest single file already (`AboutSettingsSection` is 975 LOC, `ProjectForm` is 399). Land in a maintenance window; `Project` is not a high-write table. All new columns nullable — backward compatible.

**Effort.** L (~2 days).

**Acceptance.** `npx prisma migrate deploy` runs clean. Admin can save/load model cards and eval results on a test project. Public `/projects/[slug]` renders the new sections (hidden when fields are null). Playwright visual-regression snapshots for project detail updated.

---

### PR #7 — R3F removal + hero redesign (M)

**Goal.** Cut ~700 KB of client JS, replace the supernova with an AI/ML-themed visual.

**Files.**
- Delete `components/SpaceBackground/*` (8 files: `index.jsx`, `CameraController`, `CosmicStarfield`, `SupernovaFlash`, `ReducedMotionFallback`, `constants`, `shaders`, `starColors`).
- `pages/index.jsx`: remove the `dynamic()` import of `SpaceBackground`; replace with new `components/TokenStreamBackground.jsx` (canvas-based, vanilla JS, ~150 LOC, respects `prefers-reduced-motion`, themes to `--color-primary` / `--color-accent`). Alternate path: static radial gradient if Josh opts out of the canvas visual.
- `package.json`: remove `three`, `@react-three/fiber`, `@react-three/drei`.
- `__mocks__/three.js`, `__mocks__/@react-three/*` — delete, along with their `jest.config.js` `moduleNameMapper` entries.
- Update `components/HeroSection.jsx` so the intro timing is decoupled from the deleted supernova event (the current `setTimeout(... 3300)` in `HeroSection.jsx:52` was keyed to the old 3.3s animation; trim to 0 or a short CSS-only delay).

**Risk.** Medium — the `sessionStorage.introAnimationPlayed` flag and the `introAnimationComplete` window event in `_app.js:52` are cross-component contracts. Either keep the contract with a no-op event dispatch after 100ms or remove it end-to-end.

**Effort.** M (~1 day including replacement visual).

**Acceptance.** Lighthouse perf score on `/` improves (measurable in CI). Bundle analyzer shows ~700 KB reduction. Hero renders under reduced motion (visual falls back to static palette). No console errors; no flash of unstyled content.

---

### PR #8 — MDX case studies + `/case-studies/[slug]` route + `/research` route (L)

**Goal.** Kronyx + BidOps case studies as MDX files (not CMS blobs), plus a publications/papers index.

**Files.**
- `npm i @next/mdx @mdx-js/loader @mdx-js/react`.
- `next.config.mjs`: wrap with `withMDX({ extension: /\.mdx?$/, options: { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, {...}]] }})`.
- Create `case-studies/` directory at repo root (sibling to `pages/`). Seed with `case-studies/kronyx.mdx` and `case-studies/bidops.mdx` stub templates (frontmatter: `title`, `summary`, `techStack`, `models`, `evalHeadline`, `publishedAt`, `tags`).
- Add `pages/case-studies/index.jsx` — listing page reading frontmatter via `gray-matter` or similar.
- Add `pages/case-studies/[slug].jsx` — renders the MDX with SEO + JSON-LD `Article` schema.
- Add `pages/research.jsx` — lists `Project.papers` rows plus case studies with `type: research`.
- Nav updates: add "Case Studies" to `components/Header.jsx` and `components/Footer.jsx`.

**Risk.** Medium — MDX adds build-time complexity; `gray-matter` introduces a file-read step in `getStaticProps`.

**Effort.** L (~2 days including case study stubs).

**Acceptance.** Two case study pages render with syntax-highlighted code, `Article` JSON-LD, correct canonical. `/research` page aggregates papers and research case studies. Navbar exposes the new routes. Josh can drop new MDX files into `case-studies/` without code changes.

---

### PR #9 — `/uses`, `/stack`, `/resume` static routes (S)

**Goal.** Transparency pages that match AI/ML portfolio conventions.

**Files.**
- `pages/uses.jsx` — hardware/software/LLM-stack transparency page. Content is maintainer-authored MDX (`case-studies/uses.mdx`?) or a straightforward JSX list.
- `pages/stack.jsx` — infra/framework stack, keyed to current portfolio build (Next, Prisma, Vercel, Postgres, shadcn, Shiki, etc.).
- `pages/resume.jsx` — pulls from the existing `About` Prisma table (`professionalSummary`, `technicalSkills`, `professionalExperience`, `education`, `technicalCertifications`, `leadershipExperience`) and renders a print-optimized (`@media print`) CV view. Add a `<link rel="alternate" type="application/pdf" href="/resume.pdf" />` if Josh wants a PDF sidecar (see question #6).
- Add links in `components/Footer.jsx` + `components/Header.jsx` dropdown (or keep out of primary nav and link from `/about`).

**Risk.** Low.

**Effort.** S (~4 h).

**Acceptance.** All three routes render, pass axe, and appear in `sitemap.xml`.

---

### PR #10 — Major-version upgrade: Next 16 + React 19 + Auth.js 5 + Prisma 6 + ecosystem (L)

**Goal.** Close the major-version drift in one coordinated window.

**Files.**
- `package.json`:
  - `next` → `^16.0.0` (removes `eslint-config-next@16.1.1` mismatch).
  - `react`, `react-dom` → `^19.0.0`.
  - `next-auth` → `^5.0.0` (Auth.js 5).
  - `@prisma/client`, `prisma` → `^6.0.0`.
  - `@testing-library/react` → `^16.0.0`.
  - `jest` → `^30.0.0`, `jest-environment-jsdom` → `^30.0.0`.
  - `react-toastify` → `^11.0.0`.
  - `bcryptjs` → `^3.0.0`.
  - `marked` removal is already done in PR #2.
- Auth.js 5 migration:
  - New `auth.ts` at repo root exporting `{ auth, handlers, signIn, signOut }`.
  - `pages/api/auth/[...nextauth].js` → re-export `handlers.GET`/`handlers.POST` (Pages Router compat path) or migrate to `app/api/auth/[...nextauth]/route.ts` even while rest of app stays on pages.
  - `middleware.js` uses `auth()` helper.
- Prisma 6 migration: run `npx prisma migrate dev` once; review schema for deprecation warnings (none expected at current usage).
- React 19: verify no `useRef()` without initial value, no implicit `ref` forwarding breaks; `<Suspense>` behavior in `components/FeaturedProjects.jsx` hero with `react-typed` dynamic import may need review.
- Node engines pin: add `"engines": { "node": ">=20.0.0" }` and an `.nvmrc` with `20`.
- Run full test suite; update snapshots where React 19 changes output (attribute ordering, empty-string class differences).

**Risk.** High — this is the most likely PR to uncover subtle issues. Mitigations: feature-branch builds get full Playwright runs (CI matrix already covers this); canary deploy to a Vercel preview URL for manual smoke before merging.

**Effort.** L (~2–3 days).

**Acceptance.** `npm run build` clean. All 161 Jest files + 9 Playwright specs green. Lighthouse parity or better with PR #7 baseline. Admin login flow works end-to-end (auth regression is the highest-risk). Manual smoke on home/projects/article/admin.

---

### PR #11 — [Optional / lowest priority] shadcn/ui for admin Dialog/Dropdown/Select/Toast (M)

**Goal.** Bring Radix a11y to the admin panel primitives that currently lack it.

**Files.**
- `npx shadcn@latest init` (assumes Tailwind; configure `tailwind.config.ts`-equivalent for v4 via `@theme` in `globals.css`).
- Add `components/ui/dialog.jsx`, `dropdown-menu.jsx`, `select.jsx`, `toast.jsx`, `combobox.jsx`.
- Replace `components/admin/shared/Modal.jsx` with shadcn Dialog.
- Replace `components/admin/ToastProvider.jsx` hand-roll with shadcn Toast (or migrate away from `react-toastify` entirely — saves ~30 KB).
- Refactor `components/admin/DateRangePicker.jsx` and `components/admin/BulkActionsToolbar.jsx` to use shadcn DropdownMenu.

**Risk.** Low-medium. Incremental.

**Effort.** M (~1 day).

**Acceptance.** Admin axe scan regressions = zero. No change to end-user public UI. Bundle smaller due to `react-toastify` removal.

---

### PR ordering dependencies

```
#1 ──┐
#2 ──┼── independent, ship first
#3 ──┤
#4 ──┤
#5 ──┘
#6 ── depends on #2 (admin form refactor cleaner post-purge)
#7 ── independent of content PRs
#8 ── benefits from #5 (shared MD pipeline), #6 (case study frontmatter matches project schema)
#9 ── independent
#10 ─ LAST, ship with all test runs green from #1–9
#11 ─ optional follow-up
```

---

## 4. Questions for Josh (block PR #1 execution)

1. **`/articles/new`** — delete outright or 301 to `/admin/articles/new`? (Audit says orphaned from UI; my recommendation is delete with redirect for URL-typers.)
2. **Portfolio projects** — which ones ship in the first public cut? Kronyx, BidOps, and how many more? Any under NDA / stealth?
3. **Kronyx + BidOps publicness** — name them directly with details, or describe pseudonymously ("AI platform for federal procurement" / "agentic bidding engine")? Depth of case study is limited by this.
4. **Eval data** — do you have real eval numbers / benchmark scores / latency/cost measurements for any shipped project, or is the Prisma schema aspirational (fields ready for data that doesn't exist yet)? Answer determines whether PR #6 renders real numbers or placeholders.
5. **MDX case studies** — OK with 2 stub MDXs (Kronyx + BidOps) seeded by PR #8 for you to fill in, or do you have drafts elsewhere I should pull from?
6. **Resume** — download-able PDF (provide one, or generate with `@react-pdf/renderer` from `About` data), JSON Resume format, or just the `/resume` HTML page pulling from Prisma + print styles?
7. **R3F hero** — OK to remove entirely? Replacement: (a) static gradient + typing animation, (b) lightweight canvas "token stream" / "embedding scatter" visual (~150 LOC, AI/ML-themed), (c) nothing / minimal? My vote: (b).
8. **Topic taxonomy** — proposed `['llm', 'rag', 'agents', 'evals', 'mlops', 'inference', 'finetuning', 'embeddings', 'systems', 'research', 'tools', 'career']`. Add, remove, or reorder?
9. **`/research` route** — source data: existing `Project.papers` JSON field, or add a dedicated `Publication` Prisma model (author, venue, year, url, arxivId, pdfUrl, bibtex)? Any actual papers or is this aspirational?
10. **`/uses` and `/stack`** — build or skip? These are 2026-convention transparency pages; low cost, moderate signal. My vote: build (PR #9).
11. **App Router migration** — I'm recommending **stay on Pages Router** this cycle; revisit later as a dedicated effort. Agree, or do you want the App Router migration in-scope (adds ~1 week, folds PR #3 metadata work into the file-based API)?
12. **Major upgrade PR** — one coordinated PR (#10) for Next 16 + React 19 + Auth.js 5 + Prisma 6, or split into (a) Next + React, (b) Auth.js 5, (c) Prisma 6? My vote: coordinated — they're intertwined and a single canary deploy catches interactions cheaper than three.
13. **shadcn/ui** — adopt for admin (PR #11), or stay with custom primitives indefinitely?
14. **Contact flow** — add Cal.com booking embed + qualified intake form (Consult / Contract / FT / Research collab)? Keep generic form? Route to a separate `/hire` page?
15. **Analytics** — stick with `@vercel/analytics` + the 13 custom events in `lib/analytics.js`, or add PostHog (session replay, funnels, flags, cheaper at volume)? Doesn't block PR #1 but determines whether PR #6 instruments model-card-view or eval-interact events.

---

## 5. What NOT to do

- **Don't port to TypeScript in this refactor cycle.** Mechanical conversion of 23.6k LOC JS → TS adds ~1 week of low-signal work. Revisit only if the repo grows past a single maintainer. Playwright specs are already `.ts`; leave them, don't force consistency.
- **Don't adopt tRPC / GraphQL / gRPC.** The API surface is simple CRUD serializing JSON; REST via `pages/api/*` with Prisma direct access is the right level.
- **Don't add Storybook.** No design-system consumers beyond the maintainer. Visual regression via Playwright snapshots already covers the "did this render change?" question.
- **Don't build a custom search (Algolia, Typesense, Meilisearch).** Content won't cross the scale where full-text search earns its keep. `ProjectFilters` client-side filter is sufficient.
- **Don't add Redis / Upstash / an edge cache.** Vercel CDN + ISR (`revalidate: 60`) is already in place and appropriate.
- **Don't add i18n.** Portfolio is single-language.
- **Don't chase Lighthouse 100.** Fix the SEO fundamentals (sitemap, canonicals, OG, JSON-LD) first; bundle wins come from PR #7 (R3F removal) which is independently motivated. Don't chase the last 10 points of perf score.
- **Don't migrate the design system to a library (MUI, Chakra, Mantine, HeroUI).** The custom Supernova theme + Tailwind + shadcn-where-needed composition is correct for the brand.
- **Don't adopt a headless WYSIWYG editor (Tiptap, Lexical, Novel).** Markdown is sufficient for admin-authored content; MDX handles the high-touch case studies.
- **Don't build a custom analytics dashboard.** `@vercel/analytics` + optional PostHog covers 95% of need.
- **Don't fork to a monorepo (Turborepo, Nx).** Single Next app, no shared-package justification.
- **Don't replace `next-auth` with `clerk` / `kinde` / a different provider.** Credentials flow is simple; Auth.js 5 upgrade is a drop-in for the existing shape.
- **Don't rewrite the test suite.** 161 Jest specs + 9 Playwright specs is already more coverage than the positioning goal requires. Update-as-you-go, don't audit-as-a-project.
- **Don't migrate off Vercel.** Infra choice is not a bottleneck.
- **Don't chase coverage thresholds.** README claims 50% actual / 70% target; CI threshold check is `continue-on-error`. Leave as-is. Test budget goes to the new AI/ML rendering paths in PR #6 / #8.
- **Don't add a newsletter ESP integration (Resend, Buttondown, ConvertKit) in this cycle.** The `NewsletterSubscription` Prisma table is enough until subscribers >100.
- **Don't replace the hand-rolled service worker (`public/sw.js`).** Not broken; Workbox migration is cosmetic.
- **Don't obsess over bundle sub-80KB.** Next 16 + React 19 + GSAP + Shiki will land around 180–220 KB gzipped after PR #7 — acceptable for this content profile.

---

## Verification (post-merge, per-PR baseline)

For each PR in order:

1. **Build:** `npm run build` succeeds without warnings beyond Prisma generate output.
2. **Unit:** `npm run test:coverage` — green, coverage not worse than PR baseline.
3. **E2E:** `npm run test:e2e` — full matrix passes on CI (Chromium / Firefox / WebKit + 2 mobile).
4. **Lighthouse:** CI lighthouse run (`lighthouserc.json`) — performance / a11y / SEO scores non-regressing.
5. **Manual smoke:** home, `/projects/[flagship]`, `/articles/[published]`, `/about`, `/contact`, `/admin/dashboard`.
6. **SEO-specific (PRs 3, 4, 8):** Google Rich Results Test + Twitter Card Validator + LinkedIn Post Inspector on updated pages.
7. **Bundle delta (PRs 2, 5, 7, 10):** CI bundle-size step (already in `.github/workflows/test.yml` lines 143–165) compared to `main` baseline.
8. **Canary (PR 10 only):** Vercel preview URL smoke for 24 h before merge; watch Vercel Analytics error rate.

---

## Critical file references (existing, to reuse rather than re-invent)

- `components/SEO.jsx` — extend, don't replace. Existing interface is sound.
- `lib/analytics.js` — existing event catalog; extend with `model_card_view`, `eval_view`, `case_study_read`.
- `lib/utils/projectTransformer.js` — reuse for the new AI/ML fields in PR #6.
- `lib/hooks/usePrefersReducedMotion.js` — reuse for the PR #7 replacement hero.
- `lib/hooks/useReadingAnalytics.js` — reuse on `/case-studies/[slug]` in PR #8.
- `components/admin/shared/FormField.jsx`, `TagInput.jsx`, `MediaUpload.jsx` — reuse in PR #6's admin UI extensions.
- `components/ui/MarkdownContent.jsx` — extend in PR #5; reuse in PR #8's MDX shell.
- `lib/utils/constants.js` — single-source-of-truth for the `TOPIC_OPTIONS` migration in PR #6.
- `.github/workflows/test.yml` — already includes bundle-size reporting (lines 143–165); no changes needed.
