# Portfolio Audit — jlowe.ai

Audit date: 2026-04-24. Read-only research pass against the repo at HEAD (`main`, commit `8eae4bc`).

---

## 1. Stack inventory

| Area                 | Detail                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework            | Next.js `15.1.4` (pinned `^15.1.4`), Pages Router (no `app/` dir)                                      |
| Language             | JavaScript (`.js` / `.jsx`); `jsconfig.json` only, no `tsconfig.json`. Playwright specs are `.ts`.     |
| Routing              | File-based pages router; 11 public routes, 8 admin routes, 29 API routes                              |
| Styling              | Tailwind CSS v4 (`4.1.18`) via `@tailwindcss/postcss`; `@theme` block + CSS variables in `globals.css` |
| Component library    | Hand-rolled UI primitives in `components/ui/` (Button/Card/Badge/Pagination/MarkdownContent)           |
| State management     | `useState` / `useEffect` + `SessionProvider`; no Redux/Zustand/Jotai/React Query                       |
| Data layer           | Prisma `5.20.0` against PostgreSQL; `getStaticProps` + ISR (`revalidate: 60`) on all public pages      |
| Storage              | `@vercel/blob` `2.0.0` for admin image uploads                                                         |
| Auth                 | `next-auth` `4.24.13` (credentials provider), JWT strategy, `middleware.js` gate on `/admin/*`         |
| 3D / animation       | `three@0.182`, `@react-three/fiber@8.x`, `@react-three/drei@9.x`, `gsap@3.14` + ScrollTrigger          |
| Content / markdown   | `react-markdown@9`, `remark-gfm@4`, `remark-prism`, `marked@13`, `react-syntax-highlighter@16`, `prismjs@1.29` |
| Analytics            | `@vercel/analytics@1.6.1` with 13 named custom events defined in `lib/analytics.js`                    |
| PWA                  | `public/manifest.json` + `public/sw.js` (cache-first, hand-written, not Workbox)                       |
| Deployment           | Vercel (implied by `@vercel/*` deps, `VERCEL_URL` env wiring in `lib/config.js`)                       |
| CI/CD                | GitHub Actions `.github/workflows/test.yml` — 9 jobs: lint, security (Snyk + `npm audit`), build, unit tests, e2e (3 browsers × 2 shards), visual regression, a11y, performance, lighthouse. Dependabot grouped weekly, major updates ignored. |
| Unit tests           | Jest `29.7`, `@testing-library/react@14.3`, `jest-axe`, MSW `2.12`; **161** test files under `__tests__/`; declared threshold 70% (CI gate actually `continue-on-error`) |
| E2E tests            | Playwright `1.57` on Chromium/Firefox/WebKit + 2 mobile emulators; 9 spec files (accessibility/contact/deeplinks/errors/home/navigation/performance/seo/visual); 20 snapshot baselines |
| Lighthouse CI        | `lighthouserc.json` — asserts perf ≥0.4, a11y ≥0.7, best-practices ≥0.7, SEO ≥0.7 (`warn` only)        |
| Package manager      | npm (`package-lock.json` present, 521 KB)                                                              |
| Node version         | `20` (pinned in CI `NODE_VERSION`). No `.nvmrc`. README says "18+".                                    |

---

## 2. Content map

### Public routes

| Route | File | Data source | Summary |
| ----- | ---- | ----------- | ------- |
| `/` | `pages/index.jsx` | Prisma: `welcome`, `project(status=Published, take 20)`, `post(status=Published, take 5)`, `contact`, `pageContent[home]` | 4 sections in order: `HeroSection` (typing animation + CTAs), `RecentActivity` (timeline merging projects + articles), `FeaturedProjects` (R3F `SpaceBackground` behind, tilt cards), `GitHubContributionGraph` (heatmap via `react-github-calendar`, client-only). |
| `/about` | `pages/about.jsx` | Prisma: `about`, `welcome`, `contact`, `siteSettings` | 10 sub-components: `AboutHero`, `TableOfContents`, `ProfessionalSummary`, `TechnicalSkills`, `ProfessionalExperience`, `Education`, `TechnicalCertifications`, `LeadershipExperience`, `ProfessionalDevelopment`, `Hobbies`. Content is all CMS-editable JSON. |
| `/projects` | `pages/projects.jsx` | Prisma `project` list | Grid with `ProjectFilters` (search + sort), `ProjectCard`, `ProjectsEmptyState`. |
| `/projects/[slug]` | `pages/projects/[slug].jsx` | Prisma `project` (by slug or id fallback) | Uses `ProjectDetail`. `getStaticPaths` with `fallback: "blocking"`. Skips `Draft`. |
| `/articles` | `pages/articles/index.jsx` | Prisma `post(status=Published)` | Blog index with pagination (uses UI `Pagination` primitive — the only page that does). |
| `/articles/[topic]/[slug]` | `pages/articles/[topic]/[slug].jsx` | Prisma `post` | Article page: markdown body, view counter, `PostLikeButton`, `PostComments`, `SocialShare`, reading analytics hook. |
| `/articles/new` | `pages/articles/new.jsx` | — | 485 LOC article-creation form. Gated only via `useSession` client-side (redirect in `useEffect`); the file sits on a **public** route outside `/admin/*` so `middleware.js` does not protect it. Functionality duplicates `pages/admin/articles/new.jsx` (381 LOC). |
| `/contact` | `pages/contact.jsx` | Prisma `contact` | Contact form + rotating hero word carousel, social links, availability. |

### Admin routes (middleware-gated)

`/admin/login`, `/admin`, `/admin/dashboard`, `/admin/settings`, `/admin/projects`, `/admin/articles`, `/admin/articles/new`, `/admin/articles/[id]/edit`.

### API routes (43 total)

Public: `about`, `articles`, `comments`, `comments/[id]/vote`, `contact`, `home-content`, `newsletter/subscribe`, `playlists`, `posts`, `posts/[topic]/[slug]`, `posts/[topic]/[slug]/like`, `projects`, `projects/[id]`, `revalidate`, `site-settings`, `welcome`.
Admin-only: `about`, `activity-log`, `contact`, `page-content`, `posts`, `posts/[id]`, `projects`, `projects/[id]`, `projects/bulk`, `projects/export`, `projects/import`, `site-settings`, `upload`, `welcome`.
Auth: `auth/[...nextauth]`.

### Projects featured

Not statically listed in the repo — the home page queries up to 20 Published projects from the DB and renders projects with `featured = true` via `FeaturedProjects`. No project seed file defines the actual portfolio entries.

### Writing / blog

Full CMS-managed blog: `Post` model (title/description/content/topic/slug/tags/readingTime/viewCount/coverImage/meta\*), `PostType` enum (`Article` | `Video`), playlists, comments (IP-voted), IP-based likes, newsletter subscriptions. Reading analytics (scroll depth 25/50/75/100, read duration with Page Visibility API) via `useReadingAnalytics` hook.

### Resume handling

None on disk. No `/resume` route, no PDF in `public/`, no LinkedIn/Handshake PDF link surfaced. Content is represented as structured JSON in the `about` table (professional experience, education, certifications, leadership). Handshake integration is referenced in recent commits but shows as just a social icon.

### Contact method

Contact form at `/contact` posting to `POST /api/contact`; `Contact` Prisma model stores email, phone, socials, location, availability. No email-service integration visible (no Resend/SendGrid/SES dep); API route likely just persists to DB (not inspected).

### Dynamic data sources

Prisma/PostgreSQL for all editable content. GitHub public API called client-side from `GitHubContributionGraph` (and from the now-orphaned `GitHubActivity`). No RSS, no sitemap endpoint, no OpenGraph image generator.

---

## 3. Code health

**Size.** `23,664` LOC of source (`.js`/`.jsx`/`.ts`/`.tsx`/`.css` under `pages/`, `components/`, `lib/`, `styles/`, `middleware.js`, configs) excluding `__tests__/`, `__mocks__/`, `__fixtures__/`, `e2e/`, `scripts/`. Including tests and mocks: `67,883` LOC.

**Largest files.**

| LOC | Path |
| ---:| ---- |
| 975 | `components/admin/AboutSettingsSection.jsx` |
| 677 | `styles/globals.css` |
| 565 | `components/GitHubContributionGraph.jsx` |
| 519 | `jest.setup.js` |
| 485 | `pages/articles/new.jsx` |
| 427 | `pages/admin/articles/[id]/edit.jsx` |
| 399 | `components/admin/projects/ProjectForm.jsx` |
| 398 | `components/FeaturedProjects.jsx` |
| 392 | `pages/projects.jsx` |
| 385 | `pages/contact.jsx` |
| 381 | `pages/admin/articles/new.jsx` |

**Orphan / dead code (zero external imports, verified).**

- `components/SocialLinks.jsx` — imports `@/styles/SocialLinks.module.css` which **does not exist** in `styles/`.
- `components/RecentResources.jsx` (295 LOC).
- `components/GitHubActivity.jsx` (344 LOC) — distinct from `GitHubContributionGraph`; fetches GitHub repos list client-side.
- `components/Project/Project.jsx` and its sub-components `ProjectDescription`, `ProjectTeam`, `ProjectTimeline`, `ProjectHeader`, `ProjectTechStack` are only referenced from each other and the `Project/index.js` barrel; no page renders them. The active project rendering path uses `ProjectDetail.jsx` (Tailwind) + `ProjectCard` + `ProjectFilters` + `ProjectsEmptyState` + `StatusBadge`. The orphan cluster imports `@/styles/ProjectsPage.module.css` which **does not exist**.
- `lib/fonts.js` exports `roboto`, `oswald`, `sourceCodePro` as "legacy backwards-compat aliases" that are still referenced in 11 call-sites across `pages/projects.jsx`, `pages/contact.jsx`, `pages/articles/*.jsx`, `components/Project/ProjectHeader.jsx` (`font-[family-name:var(--font-oswald)]`). The transition never completed.
- `lib/credentials-provider.cjs` has no importers (the `.cjs` file; the provider itself is externalized in `next.config.mjs`'s webpack config).

**Duplication.**

- Article creation exists in two nearly-equivalent forms: `pages/articles/new.jsx` (485 LOC, public route + client-side auth redirect) and `pages/admin/articles/new.jsx` (381 LOC, middleware-protected). Both post articles.
- The `admin/home/` folder (`HeroTab`, `WelcomeTab`, `GitHubTab`) is parallel to per-area "SettingsSection" components in `components/admin/` (`HomeSettingsSection`, `AboutSettingsSection`, `ContactSettingsSection`, `GlobalSettingsSection`, `ProjectsSettingsSection`) — two organizing conventions coexist.
- Two GitHub-flavored components (`GitHubActivity`, `GitHubContributionGraph`), only the graph is live.

**Styling approach.** Mixed. Tailwind utility classes dominate (up to 62 `className` attributes in a single file, `AboutSettingsSection.jsx`); inline `style={{ ... }}` blocks are common (14 in `GitHubActivity`, 12 in `FeaturedProjects`, 11 in `RecentActivity`). CSS modules (`ProjectsPage.module.css`, `SocialLinks.module.css`) are imported but the files are missing from disk — imports only execute through dead code paths. 677-line `globals.css` carries an `@theme` block plus ~20 hand-named section blocks (glow, glass, gradient text, buttons, scroll progress, etc.). UI primitives (`Button/Card/Badge/Pagination/MarkdownContent`) are thinly adopted — outside `components/ui/` they appear in ≤5 files total; `pages/articles/index.jsx` is the only page that composes them.

**Type coverage.** Repo is JavaScript; no `tsconfig.json`, no `*.d.ts`, no runtime validation layer (zod/yup/valibot) despite 43 API routes. `any` does not apply (JS); Playwright specs have 15 `any`/`as any` occurrences. JSDoc `@param`/`@returns` annotations appear on `lib/config.js` only; most files have no contract.

**Dead markers.** 1 `TODO`/`FIXME`/`XXX`/`HACK` across source. Otherwise clean.

**Dependency age (latest as of April 2026).**

| Dep                          | In repo  | Latest (Apr 2026)           | Status                          |
| ---------------------------- | -------- | --------------------------- | ------------------------------- |
| `next`                       | 15.1.4   | 16.x                        | 1 major behind                  |
| `react` / `react-dom`        | 18       | 19.x                        | 1 major behind                  |
| `@prisma/client` / `prisma`  | 5.20.0   | 6.x+                        | 1 major behind                  |
| `next-auth`                  | 4.24.13  | Auth.js 5 (rebrand)         | 1 major behind                  |
| `@react-three/fiber`         | 8.18.0   | 9.x (React 19 support)      | 1 major behind                  |
| `@react-three/drei`          | 9.122.0  | 10.x                        | 1 major behind                  |
| `marked`                     | 13.0.3   | 15.x                        | 2 majors behind                 |
| `react-toastify`             | 10.0.5   | 11.x                        | 1 major behind                  |
| `jest`                       | 29.7.0   | 30.x                        | 1 major behind                  |
| `@testing-library/react`     | 14.3.1   | 16.x (React 19)             | 2 majors behind                 |
| `bcryptjs`                   | 2.4.3    | 3.x                         | 1 major behind                  |
| `eslint-config-next`         | 16.1.1   | 16.x                        | **mismatched with `next@15`**   |

Dependabot is configured to group minor/patch updates weekly and explicitly **ignore every major update** — matching the staleness observed. Tailwind v4, GSAP 3.14, `@vercel/analytics` 1.6, `react-markdown` 9, `react-syntax-highlighter` 16, Playwright 1.57, ESLint 9, MSW 2.12, `@vercel/blob` 2.0 appear current.

**Other signals.**

- README badges reference `OWNER/jlowe.ai` — placeholder never filled.
- README says Node "18+"; CI uses Node 20; no `.nvmrc` or `engines` field in `package.json`.
- README claims "~50% coverage" but `jest.config.js` sets 70% thresholds. Coverage threshold command in CI is wrapped in `continue-on-error: true`.
- README lists "~256 tests across 9 test files" for e2e; actual e2e count is 9 spec files × ~29 assertions expanded across browser/shard matrix — the 256 is total matrix runs.
- `next.config.mjs` `images.remotePatterns` allows `https://**` and `http://**` — wildcard (no allow-list).

---

## 4. Perf + SEO signals

**Image handling.** All raster images route through `next/image`; zero `<img>` tags. 6 files import `next/image`. Output formats `["image/avif", "image/webp"]`. `public/images/` holds 7 static PNGs (logos only). Project thumbnails/screenshots come from Vercel Blob URLs in the DB. No responsive `sizes` audit performed.

**Font strategy.** Three Google fonts via `next/font/google` with `display: swap` and CSS variables (`--font-heading`, `--font-body`, `--font-mono`): Space Grotesk (weights 300–700), Plus Jakarta Sans (300–800), JetBrains Mono (400–600). Legacy aliases (`oswald`, `roboto`, `sourceCodePro`) still in use.

**Lazy loading.** 3 `next/dynamic` imports, all `ssr: false`: `SpaceBackground` (R3F), `GitHubContributionGraph` (react-github-calendar + GSAP), `ReactTyped`. GSAP / ScrollTrigger registration guarded by `typeof window !== "undefined"` in `_app.js`. Hover-prefetch wired up in `_app.js`. ISR on all public pages (`revalidate: 60`). Public-page `Cache-Control` header: `public, max-age=0, s-maxage=60, stale-while-revalidate=900`; admin pages `no-store`.

**Metadata / OG.** `components/SEO.jsx` emits title, description, `og:type/title/description/image/url/site_name`, `twitter:card=summary_large_image`, `twitter:title/description/image`, `robots`, `canonical`. Defaults: image `/images/logo.png` (a 192×192 PNG, not a 1200×630 social card), url `https://jlowe.ai`. `url` is passed on `/about`, `/contact`, `/articles`, and article detail; **not passed on `/` (home, benign), `/projects`, `/projects/[slug]`, or `/articles/new`** — so the projects list and every project detail page canonicalize back to the root domain. No JSON-LD structured data (grep for `application/ld+json` / `@context` returns 0). No `twitter:site` or `twitter:creator` handle (grep returns 0). Description in `public/manifest.json` ("Full stack developer") contradicts the hero copy ("AI/ML Engineer"). `_app.js` sets `theme-color="#bb1313"` (dead red) while the design token `--color-primary` is `#e85d04` (ember orange).

**Sitemap / robots.** No `public/sitemap.xml`, no `public/robots.txt`, no sitemap generator (`next-sitemap`/custom route). No grep hit for either string in the repo.

**Bundle red flags.**

- `three@0.182` + `@react-three/fiber` + `@react-three/drei` — drei is bundled; only the hero `SpaceBackground` uses R3F.
- `gsap` + `gsap/ScrollTrigger` — GSAP is imported from 14 component files.
- `react-syntax-highlighter@16` plus `prismjs@1.29` plus `remark-prism` — three overlapping code-highlight stacks coexist; `react-markdown@9` also installed.
- `react-typed`, `react-text-transition`, `react-toastify`, `react-github-calendar`, `react-intersection-observer` — each small individually; total adds up.
- `marked@13` coexists with `react-markdown` + `remark-gfm` — only one should be needed per surface.

**Service worker.** `public/sw.js` caches `['/', '/about', '/projects', '/contact', '/articles']` at install via cache-first fetch handler; `CACHE_NAME = "jlowe-ai-v2"`. Registration is fire-and-forget in `_app.js`. No precache manifest, no asset hashing, no Workbox, no update flow beyond deleting older cache names.

---

## 5. Accessibility signals

- **Skip link** in `_app.js` (`sr-only` → `focus:not-sr-only`) pointing to `#main-content`; `<main role="main" id="main-content">`.
- **Semantic landmarks** — `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>` all present across 18+ components.
- **Alt attributes**: 21 occurrences across `pages/` + `components/`. **`aria-label`**: 37. **`focus:` / `focus-visible:` / `outline`** utility classes: 61 call-sites. Custom focus styles also defined in `globals.css` under `/* ===== FOCUS STYLES ===== */`.
- **Motion accessibility** — `usePrefersReducedMotion` hook plus `getPrefersReducedMotion` helper; referenced in 12 files. `SpaceBackground/ReducedMotionFallback.jsx` exists; GSAP code paths branch on the helper.
- **Automated testing** — `@axe-core/playwright@4.11` driving `e2e/accessibility.spec.ts`; dedicated a11y job in CI; `jest-axe@10` available but usage not surveyed.
- **Lighthouse** a11y threshold `0.7` (warn only), not a hard gate.
- **Contrast** — `globals.css` comments `--color-text-muted: #8a8a8a` as "WCAG AA: 5.5:1 contrast on black". Ember-on-black accent (`#e85d04` on `#000`) hits ~5.1:1 — passes AA for UI/large text, not for regular body text at <18px. Warm white `#fafafa` on black is fine.
- **Gaps observed** — manifest `theme-color`/`background_color` (`#bb1313`/`#2c2c2c`) don't match the shipped design tokens. No visible color-contrast audit output. No explicit reduced-motion toggle or color-theme toggle in UI.
- **Form accessibility** — not audited in detail; contact/article forms use native `<input>` / `<label>` pairs (based on spot checks).

---

## 6. Gaps vs a top-tier AI/ML engineer portfolio in 2026

- **No AI/ML project depth surfaced.** Home copy positions "AI/ML Engineer, production ML pipelines, custom LLM solutions"; the data model stores projects as Prisma rows with tags and a markdown blob. No evals surfaced, no model cards, no dataset descriptions, no latency/cost tables, no reproducibility artifacts (notebooks, weights, Hugging Face links), no inference demos.
- **No live demos / interactive inference.** Three.js powers a hero animation, not a live model. No embedded chat, no inline inference widget, no streaming-response example, no embeddings/vector-search demo, no RAG playground, no agent traces.
- **No writing that signals AI/ML specialism.** The blog schema supports categories but ships no reading inventory in the repo; topics listed in `TOPIC_OPTIONS` (`javascript`, `react`, `nextjs`, `typescript`, `python`, `devops`, `database`, `security`, `career`, `tutorial`, `other`) are general web-dev, not `ml`/`llm`/`evals`/`rag`/`agents`/`inference`/`mlops`.
- **No research/publications surface.** `Project.papers` exists as a JSON column but no dedicated `/research`, `/publications`, or paper list route. No arXiv/Semantic Scholar integration. No citation exporter.
- **No open-source credibility surface.** GitHub contribution heatmap yes, but no pinned repos, no PR/commit highlights into named projects, no maintainer badges, no package ecosystem footprint (npm, PyPI, HF).
- **No benchmarks or metrics.** No tables comparing models, no eval scores, no before/after perf numbers, no cost-per-request data, no case studies with quantitative outcomes.
- **No MLOps signaling.** No mention of Weights & Biases, MLflow, Ray, Modal, Replicate, Hugging Face Inference Endpoints, Bedrock, Vertex, SageMaker, vLLM, or any model serving stack.
- **No resume / CV artifact.** No `resume.pdf`, no `/resume` route, no machine-readable CV (JSON-LD `Person`, JSON Resume), no "download CV" affordance.
- **No newsletter content promise.** `NewsletterSubscription` model exists, no cadence/topic copy, no back-issue archive.
- **No structured data.** Zero JSON-LD: no `Person`, no `Article`, no `SoftwareSourceCode`, no `CreativeWork`. Affects both SEO and AI search surfaces (Perplexity/ChatGPT/Claude grounding).
- **No discoverability by crawlers.** Missing `robots.txt`, missing `sitemap.xml` — LLM crawlers and Google both penalized.
- **No OG image generator.** Shared links reuse the 192×192 logo; no per-page 1200×630 card, no `@vercel/og` / satori usage.
- **No `/uses`, `/now`, `/stack`, `/colophon`-style transparency pages.** Common in 2026 AI-engineer portfolios.
- **Presentation isn't AI-specific.** The visual identity (Supernova space theme, R3F supernova, ember palette) reads as a creative-developer portfolio, not an applied-ML one — no distinguishing visual affordance tied to models, embeddings, agents, or data.
- **Contact flow is generic.** No calendar-booking embed (Cal/Calendly), no intake form that qualifies AI/ML engagement type (consult / contract / FT), no NDA-friendly case-study gating.
- **No testimonials / social proof block.** Common expectation for consultancy-adjacent portfolios.

---

## Gut read

The **plumbing is sound but over-engineered for what's on display** — a 23k-LOC codebase with a 9-job CI pipeline, 161 Jest files, Playwright on five browser profiles, a full Prisma-backed headless CMS, a service worker, an admin panel, ISR, reading analytics, visual regression, axe — and on the other side, seven logo PNGs in `public/`, zero shipped case studies in the repo, an AI/ML positioning that the content layer does nothing to substantiate, broken CSS-module imports hidden behind orphaned components, duplicate article-creation flows (one on a public route), canonical URLs that all point at the root, no sitemap/robots, no structured data, and ten dependencies at least one major behind (Next 15→16, React 18→19, Prisma 5→6, NextAuth 4→5, R3F 8→9, Jest 29→30, `@testing-library/react` 14→16, marked 13→15, `react-toastify` 10→11, bcryptjs 2→3). A rebuild isn't required — the data model, test harness, CMS, and design system are real assets — but the project needs an **opinionated content pass plus a deliberate ML-positioning layer** more than it needs more framework. Trim the dead Project/SocialLinks/GitHubActivity/RecentResources clusters, resolve the font-alias "legacy transition", and the remaining code is a defensible foundation; ship AI/ML artifacts on top of it rather than reaching for a fresh repo.
