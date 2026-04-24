# Portfolio Refactor Plan V2 — jlowe.ai

## Scope summary — what changed from V1

V1 recommended staying on Pages Router, a 1-week refactor cycle, and incremental shadcn adoption limited to admin gaps. V2 locks a full architectural modernization: full App Router migration (no hybrid), full TypeScript strict conversion (every `.js`/`.jsx` → `.ts`/`.tsx`, `"strict": true` + `noUncheckedIndexedAccess` + `noImplicitOverride`), full shadcn/ui adoption (retrofitting Button/Card/Badge/Pagination/MarkdownContent alongside the admin gaps), a new `Publication` Prisma model and a `ContactSubmission` model carrying an `engagementType` enum (the existing `Contact` table is a singleton config row — submissions live elsewhere), a `/resume.pdf` auto-generated via `@react-pdf/renderer` on deploy and admin webhook, Cal.com booking on `/contact`, and CardioVLM added as a third flagship alongside Kronyx 2.0 and BidOps with a "research in progress — UCF AI MIND Lab" framing. The coordinated major-version bump stays inside the refactor (PR #6) but ships on Pages Router with TypeScript already in place, so the App Router migration (PR #7) is a single-axis change: architecture only, no language or dependency churn bundled in. Total PR count: 20.

---

## PR sequence

Effort: **S** ≤ 3 h · **M** ≤ 1 day · **L** ≤ 3 days. Dependencies written as `needs #N`.

---

### PR #1 — [P0] Security: close `/articles/new` (S · no deps)

**Goal.** Remove the public client-side-gated article-creation route. The file is orphan from UI (Explore confirmed) but URL-discoverable, and submit handlers execute before the `useEffect` redirect runs.

**Files.**
- Delete `pages/articles/new.jsx` (485 LOC).
- Delete `__tests__/components/NewArticlePage.test.jsx` (imports `@/pages/articles/new`; would break the Jest run on file deletion). Confirmed by grep during execution.
- `next.config.mjs`: add `async redirects() { return [{ source: '/articles/new', destination: '/admin/articles/new', permanent: true }] }`. Note: Next emits HTTP 308 for `permanent: true` (the modern equivalent of 301; both are permanent).
- `e2e/*.spec.ts`: grep for `/articles/new`, delete or update any references. Confirmed by grep: zero references in `e2e/`.

**Risk.** Low. Orphan route, no nav link.

**Mitigation.** Grep for remaining references; `curl` hit on preview URL before merge.

**Acceptance.** `GET /articles/new` returns 308 → `/admin/articles/new`; unauth visit there redirects to `/admin/login`; e2e suite green.

---

### PR #2 — Dead code + dead deps purge (M · no deps)

**Goal.** Remove orphaned components, broken CSS-module imports, dead packages, and the incomplete font-alias transition — router-agnostic cleanup that stays valid through every subsequent PR.

**Files.**
- Delete `components/SocialLinks.jsx`, `RecentResources.jsx`, `GitHubActivity.jsx`.
- Delete `components/Project/{Project,ProjectDescription,ProjectTeam,ProjectTimeline,ProjectHeader,ProjectTechStack}.jsx`.
- Rewrite `components/Project/index.js` barrel to export only live components (`ProjectCard`, `ProjectFilters`, `ProjectsEmptyState`, `ProjectDetail`, `ProjectSkeleton`, `StatusBadge`).
- Delete `lib/credentials-provider.cjs` (verify externals in `next.config.mjs` first).
- `lib/fonts.js`: delete legacy aliases (`roboto`, `oswald`, `sourceCodePro`). Migrate 11 call-sites in `pages/projects.jsx`, `pages/contact.jsx`, `pages/articles/index.jsx`, `pages/articles/[topic]/[slug].jsx`, `components/Project/ProjectHeader.jsx` to `var(--font-heading)`.
- `package.json`: remove `marked`, `prismjs`, `react-syntax-highlighter`, `remark-prism` (unused per Explore).
- Broken `styles/*.module.css` imports: deleted as a side effect of the orphan component deletes.

**Risk.** Medium — dynamic imports could hide a user.

**Mitigation.** `grep -rn` on each deletion target, full Jest + full Playwright before merge.

**Acceptance.** `npm run build` clean, `npm test` green, `npm run test:e2e` green on chromium, ≥1,500 LOC removed per `git diff --stat`.

---

### PR #3 — TypeScript scaffold + `lib/` conversion (M · needs #2)

**Goal.** Establish strict TS baseline and convert the easiest layer first: pure utilities and hooks. Zero behavioral change.

**Files.**
- Add `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"moduleResolution": "bundler"`, `"jsx": "preserve"`, `"paths": { "@/*": ["./*"] }`, `"target": "ES2022"`.
- Delete `jsconfig.json`.
- `package.json`: add `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`.
- `eslint.config.mjs`: add typescript-eslint flat config block; keep existing rule overrides.
- `next.config.mjs`: no change (Next auto-detects TS).
- `types/` directory:
  - `types/global.d.ts` (augmented `NodeJS.ProcessEnv` for `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`).
  - `types/prisma.ts` (re-exports from `@prisma/client` for ergonomic imports).
  - `types/content.ts` (shared JSON-field shapes: `ModelCard`, `EvalResult`, `Benchmark`, `Dataset`, `TeamMember`, `Link`, `Paper`).
- Convert `lib/**/*.js` → `.ts`:
  - `lib/analytics.js` → `.ts` — type the event catalog as a const assertion + discriminated union.
  - `lib/auth.js`, `lib/config.js` (already partly JSDoc-typed), `lib/fonts.js`, `lib/prisma.js`.
  - `lib/hooks/*.js` (6 files).
  - `lib/utils/*.js` (18 files).
- Don't touch `components/` or `pages/` — they stay `.jsx` with implicit `any` at the boundary (handled by next PRs).
- `jest.config.js`: add `.ts` to `moduleFileExtensions` (already present per audit — verify).

**Risk.** Low-medium. Strict-mode flags can surface implicit-any at call-sites in still-JS files; handle with JSDoc-typed exports or `// @ts-expect-error` only inside the JS → TS seams.

**Mitigation.** Convert leaf utilities first (`dateUtils`, `jsonUtils`, `projectValidators`, `readingTime`, etc.), then hooks, then the transformers/helpers with Prisma types.

**Acceptance.** `npx tsc --noEmit` clean for `lib/` + `types/`. `npm run lint` passes. `npm test` green. No runtime behavior change.

---

### PR #4 — Convert `components/` to TS (M · needs #3)

**Goal.** Every component file `.jsx` → `.tsx` with proper Props types. No behavior change.

**Files.** ~85 component files under `components/`. Each gets:
- `interface XProps { ... }` or `type XProps = { ... }` above the component.
- `export default function X({ ... }: XProps)` signature.
- Event handlers typed (`React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`).
- `useRef` generics (`useRef<HTMLDivElement>(null)`).
- `useState` inferred or explicit generic when the initial value is `null`/`[]`/`undefined`.
- `__mocks__/*` also converted or retyped with `.d.ts` ambient declarations.

**Scope reference.** Largest files requiring care: `components/admin/AboutSettingsSection.jsx` (975 LOC, nested form state), `components/GitHubContributionGraph.jsx` (565 LOC), `components/admin/projects/ProjectForm.jsx` (399), `components/FeaturedProjects.jsx` (398).

**Risk.** Medium — some JSX idioms hide untyped props or pass-through spreads. The admin forms are the riskiest.

**Mitigation.** Convert in waves grouped by feature (`About/*`, then `Articles/*`, then `Project/*`, then `admin/*` last because it's largest). Review `tsc --noEmit` output after each wave before proceeding.

**Acceptance.** `npx tsc --noEmit` clean. All 161 Jest specs still green (update any JS-idiom spec that breaks under types, but avoid changing test logic). No `@ts-ignore` anywhere; `@ts-expect-error` only allowed with one-line rationale comment.

---

### PR #5 — Convert `pages/` to TS (M · needs #4)

**Goal.** All pages and API routes converted to `.tsx`/`.ts`, still on Pages Router semantics.

**Files.**
- `pages/_app.jsx` → `_app.tsx` with `AppProps` from `next/app`.
- `pages/_document.js` → `_document.tsx`.
- All public pages: typed via `GetStaticProps<Props>` + `InferGetStaticPropsType`.
- `pages/api/**/*.js` → `.ts` with `NextApiRequest` + `NextApiResponse<ResponseShape>`.
- `middleware.js` → `middleware.ts`.
- Shared API response types collocated in `types/api.ts`.

**Risk.** Medium — Prisma `Json` fields deserialize as `Prisma.JsonValue`; narrowing requires runtime validators. Use the shared shapes from `types/content.ts` (PR #3) with a light `parseJsonField` helper (already exists in `lib/utils/jsonUtils.js`).

**Mitigation.** Start with API routes (simpler shape), then static pages, then dynamic `[slug]` pages.

**Acceptance.** `npx tsc --noEmit` clean on full repo. `npm run build` clean. All 161 Jest + 9 Playwright specs green. Behavior parity verified by visual-regression snapshots.

---

### PR #6 — Coordinated major upgrade (L · needs #5)

**Goal.** Close major-version drift before the App Router migration so PR #7 is a single-axis architecture change, not a mixed stack-and-architecture bump.

**Files — `package.json` bumps.**
- `next` → `^16`
- `react`, `react-dom` → `^19`
- `next-auth` → `^5` (Auth.js 5)
- `@prisma/client`, `prisma` → `^6`
- `jest` → `^30`
- `jest-environment-jsdom` → `^30`
- `@testing-library/react` → `^16`
- `@testing-library/user-event` → current
- `react-toastify` → `^11` (will be removed in PR #11, but bump it now so PR #7 migration is on supported versions)
- `bcryptjs` → `^3`
- `eslint-config-next` → `^16` (already there, alignment fix)
- `engines`: add `"node": ">=20.0.0"`.
- Add `.nvmrc` with `20`.

**Migration work (Pages Router still).**
- Auth.js 5 on Pages: new `auth.ts` at repo root exporting `{ auth, handlers, signIn, signOut }`. Keep `pages/api/auth/[...nextauth].ts` importing `handlers` (Pages-Router shim pattern). `middleware.ts` switches to `auth()` helper.
- Prisma 6: run `npx prisma migrate dev` once; review schema for deprecation warnings.
- React 19: audit `useRef()` call-sites for missing initial values, audit `forwardRef` usage, ensure Strict Mode double-invoke is safe (existing code already sets `reactStrictMode: true`).
- Jest 30: review any custom jsdom APIs in `jest.setup.js` / `jest.polyfills.js` (519 LOC of setup — highest-risk file).
- `@testing-library/react` 16: check `render()`/`screen` API compat (minimal break).
- Update Jest snapshots where React 19 changes output ordering.

**Risk.** High. Five concurrent major bumps + Auth rewrite.

**Mitigation.** Feature branch on a Vercel preview URL. Canary smoke 24 h before merge. Run full Playwright matrix (3 browsers × 2 shards + 2 mobile) on the preview build.

**Acceptance.** `npm run build` clean. Typecheck clean. All 161 Jest + 9 Playwright specs green. Admin login flow manually verified (auth is the riskiest surface). Lighthouse CI non-regressing.

---

### PR #7 — App Router migration (L · needs #6)

**Goal.** Every route under `app/`. No `pages/` survivors except the migration-transition `pages/api/auth/[...nextauth].ts` if the Pages shim is still needed (otherwise move fully). This is the single largest architectural change in the plan.

**Files — directory restructure.**
- Create `app/` tree:
  - `app/layout.tsx` (root layout, replaces `_app.tsx` + `_document.tsx`; ErrorBoundary, SessionProvider, Analytics, skip link).
  - `app/globals.css` (moved from `styles/globals.css`).
  - `app/page.tsx` (home, RSC by default; `"use client"` on interactive children only).
  - `app/about/page.tsx`.
  - `app/projects/page.tsx`.
  - `app/projects/[slug]/page.tsx` with `generateStaticParams()` replacing `getStaticPaths()`.
  - `app/articles/page.tsx`.
  - `app/articles/[topic]/[slug]/page.tsx`.
  - `app/contact/page.tsx`.
  - `app/admin/layout.tsx` (admin shell).
  - `app/admin/login/page.tsx`, `app/admin/dashboard/page.tsx`, `app/admin/projects/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/articles/page.tsx`, `app/admin/articles/new/page.tsx`, `app/admin/articles/[id]/edit/page.tsx`.
  - `app/api/**/route.ts` — 43 API routes ported from `pages/api/**/*.ts` to route handlers (`export async function GET(request: Request) { ... }`).
  - `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`.
- Data fetching: replace `getStaticProps` with direct Prisma calls inside RSCs (cached with `unstable_cache` or `revalidate` segment config). Replace `getStaticPaths` with `generateStaticParams`.
- Client-component boundary: `"use client"` at the top of every file using `useState`/`useEffect`/`useRef`/GSAP/event handlers. Required files: `HeroSection`, `FeaturedProjects`, `RecentActivity`, `GitHubContributionGraph`, admin forms, article comment components, all existing `components/admin/*`, `components/ui/ScrollProgress`. Each "use client" line followed by a one-line justification comment per CLAUDE.md standing orders.
- `middleware.ts`: updated to App Router patterns (largely unchanged — it still matches `/admin/:path*`).
- Move `lib/fonts.ts` import into `app/layout.tsx`; drop from `_app`.
- Move `SEO.jsx` usage — it becomes dead after PR #8.
- Delete `pages/` directory once the port is green (except the Auth.js Pages shim if retained).

**Risk.** High. 19 routes + 43 API routes to port. RSC/Client split is a per-file design call. Tests referencing `getStaticProps` structure break.

**Mitigation.** Canary 24 h on Vercel preview. Port routes in dependency order (API first, then static pages, then dynamic pages, then admin). Keep behavior verified by Playwright snapshots which are route-level (URL-shape-agnostic).

**Acceptance.** `npm run build` clean, no `pages/` surviving. Full test suite green. Lighthouse performance non-regressing. Admin auth flow manually verified. Bundle-size report: expect reduction from RSC-first pages (home, projects list, articles list are server-rendered with zero JS for the wrapper).

---

### PR #8 — App Router SEO foundation (M · needs #7)

**Goal.** Ship App Router-native SEO: Metadata API, file-based sitemap/robots/OG-image, JSON-LD helper, canonicals correct per route.

**Files.**
- `app/sitemap.ts` — Prisma query for published Project slugs + Post topic/slug, plus static routes (/, /about, /projects, /articles, /contact, /research, /uses, /stack, /resume, /case-studies).
- `app/robots.ts` — allow all public, disallow `/admin/*` + `/api/*`, sitemap URL.
- `app/opengraph-image.tsx` (root template, ember-on-black Supernova aesthetic, Space Grotesk via `next/og`).
- Per-route `app/[segment]/opengraph-image.tsx` where a custom card is needed: `/projects/[slug]`, `/articles/[topic]/[slug]`, `/case-studies/[slug]`.
- `generateMetadata` async function on each route — titles, descriptions, `openGraph`, `twitter`, `alternates.canonical` derived from pathname.
- `components/JsonLd.tsx` — Server Component emitting `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`. Schemas:
  - `Person` on `/about`.
  - `WebSite` + `SearchAction` on `/`.
  - `Article` on `/articles/[topic]/[slug]` and `/case-studies/[slug]`.
  - `SoftwareSourceCode` on `/projects/[slug]`.
  - `ScholarlyArticle` on `/research/[slug]` (when that data model lands in PR #12, this gets wired in PR #15 too — initial helper lives here).
  - `BreadcrumbList` on all detail pages.
- `public/manifest.json` update: description → "AI/ML Engineer", `theme_color` → `#e85d04`, `background_color` → `#000000`.
- Delete `components/SEO.jsx` (dead after Metadata API adopted).

**Risk.** Low. Metadata API is declarative; JSON-LD is static JSON.

**Mitigation.** Rich Results Test + Twitter Card Validator + LinkedIn Post Inspector on each touched route before merge.

**Acceptance.** `/sitemap.xml` and `/robots.txt` respond correctly. Every route has unique canonical. OG card renders per route. All JSON-LD validates.

---

### PR #9 — Remove R3F, ship `TokenStreamBackground` (M · needs #7)

**Goal.** Cut ~700 KB of client JS, swap the supernova animation for an AI/ML-themed canvas visual.

**Files.**
- Delete `components/SpaceBackground/*` (8 files).
- Delete `__mocks__/three.js`, `__mocks__/@react-three/fiber.jsx`, `__mocks__/@react-three/drei.jsx`.
- Remove `jest.config.ts` `moduleNameMapper` entries for the mocks.
- `package.json`: remove `three`, `@react-three/fiber`, `@react-three/drei`.
- Add `components/TokenStreamBackground.tsx` — ~150 LOC vanilla canvas. Contract:
  - Renders a full-viewport fixed canvas at `z-0`.
  - Animates ~200 particles flowing left-to-right with speed variance (token-stream metaphor) — colors mixed from `--color-primary` and `--color-accent`.
  - Fallback to static radial gradient under `prefers-reduced-motion` (reuses `lib/hooks/usePrefersReducedMotion.ts`).
  - Pauses animation when `document.hidden` (Page Visibility API).
  - Resizes on window resize with throttling.
  - `"use client"` — canvas API requires it; justification comment: `// interactive canvas animation`.
- `app/page.tsx` imports `TokenStreamBackground` in place of the old `SpaceBackground`.
- `components/HeroSection.tsx`: drop the 3.3s `introAnimationComplete` window-event dance (coupled to the deleted supernova). Replace with a short CSS delay or immediate render.
- `app/layout.tsx`: remove the `introAnimationPlayed` sessionStorage + listener from `_app`'s migrated code — no longer needed.

**Risk.** Medium. Visual identity changes materially.

**Mitigation.** Update Playwright visual-regression baselines with reviewer approval. Verify reduced-motion fallback manually.

**Acceptance.** Lighthouse perf on `/` improves (bundle-size CI step shows ~700 KB drop). Canvas renders above `prefers-reduced-motion: reduce` and below. No console errors. Hero content paints without waiting on the animation.

---

### PR #10 — Shiki via `rehype-pretty-code` (S · needs #7)

**Goal.** Real syntax highlighting in blog posts and MDX case studies, single pipeline.

**Files.**
- `package.json`: `npm i shiki rehype-pretty-code`.
- `components/ui/MarkdownContent.tsx` (renamed from `.jsx` in PR #4): add `rehypePlugins={[[rehypePrettyCode, { theme: 'github-dark' }]]}` to `<ReactMarkdown>`.
- `components/admin/MarkdownEditor.tsx`: same.
- `app/articles/[topic]/[slug]/page.tsx`: delete the inline `CodeBlock` component (was `pages/articles/[topic]/[slug].jsx` lines 14–24) — use default rehype output.
- Add `/* ===== CODE BLOCKS ===== */` section in `app/globals.css` with Supernova-themed `pre`/`code` styles (overrides theme background to match card background, keeps token colors from Shiki).
- MDX pipeline in PR #14 will reuse the same plugin config — single source in `lib/markdown/config.ts`.

**Risk.** Low.

**Mitigation.** Visual-regression snapshots updated.

**Acceptance.** Fenced code blocks render with Supernova-themed syntax highlighting. Bundle not inflated (Shiki is primarily build-time for static rendering; run-time cost is minimal for admin preview).

---

### PR #11 — shadcn/ui full adoption (L · needs #7, #10)

**Goal.** Retire hand-rolled primitives, bring Radix a11y everywhere, delete `react-toastify`.

**Files.**
- `npx shadcn@latest init` (Tailwind v4 config via `@theme` in `app/globals.css`; shadcn's `components.json` pointed at `components/ui/`).
- Add primitives: `button`, `card`, `badge`, `dialog`, `dropdown-menu`, `select`, `combobox`, `form`, `input`, `textarea`, `checkbox`, `radio-group`, `tabs`, `sheet`, `popover`, `scroll-area`, `separator`, `toast` (or `sonner` — shadcn's modern choice), `skeleton`, `tooltip`, `alert-dialog`, `pagination`.
- Retrofit public UI:
  - Replace old `components/ui/Button.tsx` uses with shadcn Button; migrate variants.
  - Replace `components/ui/Card.tsx`, `Badge.tsx`, `Pagination.tsx`, `MarkdownContent.tsx` (keep MarkdownContent but rename to `components/markdown/Content.tsx` — not a shadcn primitive).
  - `ScrollProgress` stays custom — no shadcn equivalent.
- Retrofit admin UI:
  - `components/admin/shared/Modal.tsx` → shadcn Dialog.
  - `components/admin/ToastProvider.tsx` → shadcn Toaster (Sonner) provider in `app/layout.tsx` or `app/admin/layout.tsx`.
  - `components/admin/DateRangePicker.tsx` → shadcn Calendar + Popover.
  - `components/admin/BulkActionsToolbar.tsx` → shadcn DropdownMenu.
  - `components/admin/shared/FormField.tsx` + `TagInput.tsx` → shadcn Form + Input/Badge combos.
  - `components/admin/MarkdownEditor.tsx`: keep markdown textarea; wrap in shadcn Tabs (Edit / Preview).
- Delete:
  - `components/ui/Button.tsx` (old), `Card.tsx`, `Badge.tsx`, `Pagination.tsx`.
  - `components/admin/shared/Modal.tsx` (old).
  - `components/admin/ToastProvider.tsx` (old).
  - `package.json`: remove `react-toastify`.
  - `styles/toast.css` (superseded by Sonner styling).

**Risk.** Medium. Touches most of the admin panel and several public pages.

**Mitigation.** Retrofit admin first (higher a11y ROI), public second (lower change density). Visual-regression snapshots regenerated in one sweep at end of PR.

**Acceptance.** Axe a11y tests pass on admin. Bundle lighter (~30 KB `react-toastify` removal). No visual regressions in public UI beyond reviewer-approved button/card style diffs.

---

### PR #12 — Prisma schema: AI/ML fields + Publication + ContactSubmission (L · needs #6)

**Goal.** Load-bearing schema extension. Substantiates AI/ML positioning at the data layer.

**Files.**
- `prisma/schema.prisma`:
  - Extend `Project`:
    ```
    modelCards      Json?     // [{ name, baseModel, taskType, inputModalities, outputModalities, trainingData }]
    evalResults     Json?     // [{ benchmark, score, unit, baseline, source }]
    benchmarks     Json?      // [{ metric, value, unit, condition }]
    latencyMs       Int?
    latencyP99Ms    Int?
    costPerRequest  String?
    costUnit        String?
    datasets        Json?     // [{ name, sizeRows, license, url }]
    inferenceUrl    String?
    modelProvider   String?
    frameworks      String[]
    ```
  - New `Publication` model:
    ```
    model Publication {
      id          String   @id @default(cuid())
      title       String
      authors     String[]
      venue       String?
      year        Int
      url         String?
      arxivId     String?
      pdfUrl      String?
      bibtex      String?
      doi         String?
      abstract    String?
      publishedAt DateTime?
      projectId   String?
      project     Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
      topics      String[]
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt

      @@index([year])
      @@index([projectId])
      @@map("publications")
    }
    ```
  - New `ContactSubmission` model (the existing `Contact` is a singleton config, not a submissions table):
    ```
    enum EngagementType {
      Consult
      Contract
      FullTime
      ResearchCollab

      @@map("engagement_type")
    }

    model ContactSubmission {
      id              String          @id @default(cuid())
      name            String
      email           String
      company         String?
      engagementType  EngagementType
      message         String
      metadata        Json?
      createdAt       DateTime        @default(now())

      @@index([engagementType])
      @@index([createdAt])
      @@map("contact_submissions")
    }
    ```
  - Add relation on `Project`: `publications Publication[]`.
- `npx prisma migrate dev --name ai_ml_fields_publications_submissions`.
- `types/content.ts`: add strict types mirroring the JSON columns.
- `lib/constants.ts`: topic taxonomy single source — locked to `['agents', 'llm', 'vlm', 'rag', 'evals', 'mlops', 'inference', 'systems', 'research', 'medical-ai', 'tools', 'career']` (12 items; the original `'inferensystems'` entry resolved to `'inference'` + `'systems'` as two separate topics).
- `components/admin/projects/ProjectForm.tsx` (already TS after PR #4): add sections for Model Cards (repeater), Eval Results (table), Latency/Cost/Frameworks (fields), Datasets (repeater), Inference URL, Model Provider.
- New admin page `app/admin/publications/page.tsx` + CRUD route handlers under `app/api/admin/publications/*`.
- `components/admin/AdminSidebar.tsx`: add Publications + Submissions links.

**Risk.** Medium. Schema migration on prod. New admin surface.

**Mitigation.** All new Project columns nullable — backward compatible. `Publication` + `ContactSubmission` are new tables. Migration tested on local DB before deploy.

**Acceptance.** `npx prisma migrate deploy` clean. Admin can save/load model cards and eval results on a test project. Admin can create Publications. `ContactSubmission` table exists with enum.

---

### PR #13 — Public rendering of AI/ML fields on `/projects/[slug]` (M · needs #12, #11, #8)

**Goal.** Surface the schema on the project detail page.

**Files.**
- `app/projects/[slug]/page.tsx`: extend the project detail RSC with a new "Model & Evals" section when the project has any AI/ML fields populated.
- `components/projects/ModelCard.tsx` (new): renders a single model card (base model, task, modalities, training data).
- `components/projects/EvalTable.tsx` (new): renders benchmark results with baseline comparison column.
- `components/projects/LatencyCostBar.tsx` (new): renders `latencyMs` / `latencyP99Ms` / `costPerRequest` / `costUnit`.
- `components/projects/FrameworkBadges.tsx` (new): shadcn Badge row for `frameworks`.
- `components/projects/DatasetList.tsx` (new): named dataset chips with link-out.
- `components/projects/InferenceLink.tsx` (new): CTA to try inference endpoint if `inferenceUrl` present.
- Extend `components/JsonLd.tsx` with optional `Dataset` + `SoftwareApplication` sub-schemas.

**Risk.** Low. Additive UI; hidden when fields are null.

**Mitigation.** Visual-regression on an admin-seeded sample project.

**Acceptance.** Project with populated AI/ML fields renders all new sections. Project without renders as before. Lighthouse non-regressing.

---

### PR #14 — MDX case studies + `/case-studies/[slug]` (L · needs #7, #10, #11)

**Goal.** MDX-backed case studies for Kronyx 2.0, BidOps, CardioVLM.

**Files.**
- `package.json`: `npm i @next/mdx @mdx-js/loader @mdx-js/react gray-matter`.
- `next.config.mjs` → `next.config.ts`: wrap with `withMDX({ extension: /\.mdx?$/, options: { remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, {...}]] } })`.
- Add `content/case-studies/` directory (root-level, sibling to `app/`):
  - `kronyx-2.mdx`
  - `bidops.mdx`
  - `cardiovlm.mdx` (frontmatter: `status: "research in progress"`, `lab: "UCF AI MIND Lab"`, `advisor: "..."`)
- `app/case-studies/page.tsx` — lists frontmatter summaries via `gray-matter`.
- `app/case-studies/[slug]/page.tsx` — renders MDX with SEO `generateMetadata` + Article JSON-LD.
- `mdx-components.tsx` at repo root — shared shadcn component map for MDX (`h1`/`h2`/`Table`/`Alert`/`Callout`/`EvalTable` re-exports).
- Update `components/Header.tsx` + `components/Footer.tsx`: add "Case Studies" link.
- Reuse `lib/hooks/useReadingAnalytics.ts` on the page for `case_study_read` instrumentation (wired in PR #19).

**Risk.** Medium. MDX build complexity; Tailwind class-purge for MDX content requires `content/**/*.mdx` glob.

**Mitigation.** Tailwind v4 `@source "./content/**/*.mdx"` in `app/globals.css`. Build-time smoke.

**Acceptance.** Three case study pages render with syntax-highlighted code, Article JSON-LD, correct canonicals, proper OG images. Listing page aggregates frontmatter.

---

### PR #15 — `/research` route (M · needs #12, #14)

**Goal.** Publications + research-tagged case studies on a single index.

**Files.**
- `app/research/page.tsx` — Server Component querying `Publication` + filtering case studies where frontmatter `topic === 'research'`.
- `app/research/[slug]/page.tsx` — individual Publication detail (when full paper metadata available).
- `lib/queries/publications.ts` — Prisma query helper, colocated by convention (CLAUDE.md).
- JSON-LD: `ScholarlyArticle` schema per publication.
- Sort by year descending; group by year heading.
- Cite block with `bibtex` copy-to-clipboard button.

**Risk.** Low.

**Acceptance.** Route renders with test Publication rows. Bibtex copy works. ScholarlyArticle JSON-LD validates.

---

### PR #16 — `/uses`, `/stack` MDX transparency pages (S · needs #14)

**Goal.** 2026-convention transparency pages.

**Files.**
- `content/pages/uses.mdx` — hardware, models, tools, dev setup.
- `content/pages/stack.mdx` — infra + framework stack.
- `app/uses/page.tsx` and `app/stack/page.tsx` — render MDX. Reuse the MDX component map from PR #14.
- Directory decision: **`content/` at repo root**, split into `content/case-studies/` and `content/pages/` — locked.
- Footer links added.

**Risk.** Low.

**Acceptance.** Routes render, appear in sitemap, axe clean.

---

### PR #17 — `/resume` HTML + `/resume.pdf` generator (M · needs #12, #7)

**Goal.** HTML resume for quick consumption + auto-generated PDF sidecar.

**Files.**
- `app/resume/page.tsx` — Server Component pulling from Prisma `About` table (`professionalSummary`, `technicalSkills`, `professionalExperience`, `education`, `technicalCertifications`, `leadershipExperience`). Print-optimized via `@media print` rules in `app/globals.css`.
- `<link rel="alternate" type="application/pdf" href="/resume.pdf" />` in page metadata.
- `scripts/generate-resume.ts` — Node script using `@react-pdf/renderer` to emit `public/resume.pdf` from the same data. Runs in:
  - `npm run build` (via `prebuild` script).
  - Admin webhook: `POST /api/admin/about` triggers a regeneration step (fire-and-forget).
- `app/api/admin/about/route.ts` (migrated in PR #7) extended to invoke the PDF generator after a successful write.
- Link in `app/about/page.tsx` and Footer.

**Risk.** Medium. `@react-pdf/renderer` has its own layout engine — visual design takes iteration.

**Mitigation.** Start with a single-column minimal PDF; iterate post-ship.

**Acceptance.** `/resume` renders from DB. `/resume.pdf` downloads. PDF regenerates on `npm run build`. Admin About save triggers regeneration (logged).

---

### PR #18 — Contact flow: Cal.com embed + qualified intake (M · needs #12, #11)

**Goal.** Replace generic contact form with a Cal.com booking path + a qualified-engagement form writing to `ContactSubmission`.

**Files.**
- `app/contact/page.tsx`: two sections.
  - Top: Cal.com inline embed via `@calcom/embed-react`. Event URL from `lib/config.ts` (add `CAL_USERNAME` env).
  - Bottom: qualified intake form — fields: name, email, company, `engagementType` (shadcn RadioGroup: Consult / Contract / Full-Time / Research Collab), message.
- `app/api/contact/route.ts`: POST handler writing to `ContactSubmission`. Validate with a shared `types/content.ts` shape + Zod (add `zod` dep) or hand-rolled guards.
- Remove the old `pages/api/contact/index.js` (migrated in PR #7).
- Thank-you state inline (no redirect).

**Risk.** Low-medium. Cal.com embed is standard; Zod introduces a new dep (justified in PR comment per CLAUDE.md).

**Mitigation.** Test Cal.com embed in Vercel preview before merge.

**Acceptance.** Cal.com embed renders and lets a real booking happen. Intake submission creates a `ContactSubmission` row with correct enum. Form validates (required fields, email format).

---

### PR #19 — Analytics event wiring (S · needs #13, #14, #17, #18)

**Goal.** Event instrumentation for the new surfaces.

**Files.**
- `lib/analytics.ts` (TS since PR #3): extend `ANALYTICS_EVENTS` enum with `model_card_view`, `eval_view`, `case_study_read`, `resume_download`, `cal_booking_click`, `intake_submit`.
- Call sites:
  - `model_card_view`: `components/projects/ModelCard.tsx` — IntersectionObserver with 50 % threshold.
  - `eval_view`: `components/projects/EvalTable.tsx` — same.
  - `case_study_read`: `app/case-studies/[slug]/page.tsx` — reuse `useReadingAnalytics`.
  - `resume_download`: `app/resume/page.tsx` (and any link to `/resume.pdf`) — `onClick`.
  - `cal_booking_click`: `app/contact/page.tsx` — Cal.com embed `onEvent` (`bookingSuccessful` or similar).
  - `intake_submit`: `app/contact/page.tsx` — form `onSubmit` after successful POST.
- Typed helpers exported alongside existing helpers in `lib/analytics.ts`.

**Risk.** Low.

**Acceptance.** Events appear in Vercel Analytics > Custom Events within a test window.

---

### PR #20 — Cleanup sweep (M · needs all prior)

**Goal.** Close the refactor cycle. Ensure every measurable baseline is documented.

**Files.**
- Playwright visual snapshots: full regeneration + reviewer approval.
- Lighthouse CI: compare scores pre-/post-refactor; store a `.lighthouseci/` baseline.
- Bundle audit: Next 16 `@next/bundle-analyzer`. Record home/projects/articles bundle sizes in `README.md`.
- `README.md`: full rewrite for the new stack. Drop OWNER/jlowe.ai badge placeholders. Update scripts, env vars, setup.
- `.github/dependabot.yml`: remove the major-update ignore directive; add a grouped major-updates ungrouped PR per dependency. Frequency: monthly for majors, weekly for minors/patches (current).
- `CHANGELOG.md`: write a release note summarizing PRs #1–19.
- Remove any remaining `pages/` files (should be empty except possibly the auth shim).
- Purge stale e2e fixtures that referenced dead routes (`/articles/new`).

**Risk.** Low.

**Acceptance.** Lighthouse non-regressing vs PR #9 baseline. Bundle size documented. README accurate. Dependabot next run opens major-update PRs for any still-outdated deps (canary).

---

## PR dependency graph

```
#1 (P0, any time — ship first)
#2 (router-agnostic cleanup)
      │
      ▼
#3 (TS scaffold + lib/)
      │
      ▼
#4 (components/ to TS)
      │
      ▼
#5 (pages/ to TS, still Pages Router)
      │
      ▼
#6 (major upgrade, still Pages Router)
      │
      ▼
#7 (App Router migration) ────┬─────────── #12 (schema)
      │                       │                   │
      ▼                       ▼                   │
#8 (SEO)              #9 (R3F removal)           │
      │                       │                   │
      ▼                       ▼                   │
#10 (Shiki) ────────────── #11 (shadcn full) ───┬─▼
                                 │              ▼
                                 │            #13 (render AI/ML)
                                 │              │
                                 ▼              │
                              #14 (MDX) ────────┤
                                 │              │
                                 ├────► #15 (research)
                                 │              │
                                 ├────► #16 (uses/stack)
                                 │              │
                                 ├────► #17 (resume + PDF)
                                 │              │
                                 └────► #18 (contact Cal.com + intake)
                                                │
                                                ▼
                                          #19 (analytics)
                                                │
                                                ▼
                                          #20 (cleanup)
```

---

## Verification (per-PR baseline)

Every PR, in order:

1. **Typecheck:** `npx tsc --noEmit` clean (starting PR #3).
2. **Lint:** `npm run lint` clean.
3. **Build:** `npm run build` succeeds without new warnings.
4. **Unit:** `npm run test:coverage` green; coverage not worse than the PR's baseline.
5. **E2E:** `npm run test:e2e` green on full matrix (Chromium / Firefox / WebKit + 2 mobile) in CI.
6. **Lighthouse:** `lighthouserc.json` non-regressing vs prior PR's baseline.
7. **Manual smoke:** home, projects list, flagship project detail, articles list, published article detail, case studies index, flagship case study, about, contact, research, uses, resume, admin dashboard.
8. **SEO validators (PR #8 is primary, plus any SEO-relevant PR):** Google Rich Results Test + Twitter Card Validator + LinkedIn Post Inspector.
9. **Axe (all PRs with UI changes):** Playwright axe job green; no new violations on touched routes.
10. **Bundle delta (PRs #2, #9, #11, #20):** CI bundle-size step compared to `main` baseline.
11. **Canary on Vercel preview — 24 h minimum for PR #6 and PR #7.** Smoke: admin login, home, one of each dynamic route, one admin CRUD flow. Watch Vercel Analytics error rate and Lighthouse on preview URL.

---

## Risks + rollback plan

**Highest-risk: PR #6 (coordinated major upgrade) + PR #7 (App Router migration).**

- **PR #6.** Five concurrent majors (Next 16, React 19, Auth.js 5, Prisma 6, Jest 30). Rollback plan: feature branch; if the canary shows any regression, revert the feature branch. Tests in `jest.setup.js` (519 LOC) are the highest-value bellwether — if they fail, it's likely a JSDOM change in Jest 30. Preserve the Auth.js 4 configuration in a commit on the branch so Auth.js 5 can be backed out isolated if that is the specific failure. **Rollback unit:** the PR itself is one commit series; `git revert` the merge commit returns the tree to pre-upgrade state.
- **PR #7.** Every route touched. Failure modes: a client/server component split wrong (hydration mismatch), an API route response shape drifted (frontend breakage), a cache-control header lost on migration. Rollback plan: App Router migration ships as one atomic PR behind a canary 24 h on preview. If the canary reveals a route-level regression, fix-forward in a follow-up PR; if critical, revert the merge commit. Because PRs #8–19 all depend on `app/` existing, a revert of #7 blocks the chain — but all prior PRs (#1–6) are independent and stay live.
- **PR #12.** Schema migration on prod DB. All new columns nullable + new tables — backward compatible, so rollback is a `DROP COLUMN` / `DROP TABLE` migration without data loss.
- **PR #17.** `@react-pdf/renderer` can balloon cold-start time on the admin webhook. Mitigation: generate at build time only; admin webhook dispatches to a background job or re-triggers deploy rather than blocking the request.
- **PR #11.** Replacing `react-toastify` globally risks toast-call-site regressions. Mitigation: grep for `toast.` usages before merge, compile-time error if a call-site uses an unmapped API.

**General rollback posture.** Every PR ships through `main` after preview smoke. If a production regression surfaces post-merge, the rollback unit is the PR's squash-merge commit — `git revert <sha>` on `main` and redeploy. For PR #6 and #7 the canary window is 24 h on Vercel preview; no merge to `main` before that window is green.

---

## Effort estimate

| Size | Hours (mid) | PRs |
| ---- | ----------- | --- |
| S    | 2 h         | #1, #10, #16, #19 |
| M    | 6 h         | #2, #3, #4, #5, #8, #9, #11, #13, #15, #17, #18, #20 |
| L    | 18 h        | #6, #7, #12, #14 |

**Totals.** S: 4 × 2 = 8 h. M: 12 × 6 = 72 h. L: 4 × 18 = 72 h. **Sum: ~152 hours.**

At **10 focused hours/week**, that's **~15 weeks (~3.5 months)** of calendar time assuming no major blockers. Realistic range accounting for canary windows + unexpected regressions: **4–5 months**.

Fastest-to-ship safety wins (first 3 weeks):
- Week 1: PR #1 + PR #2 (14 h combined).
- Weeks 2–3: PR #3 + #4 (24 h combined).

Most content-leveraged wins (weeks 10–13): PR #14 + #15 + #17 (42 h combined) — these are the PRs that materially convert the site into an AI/ML portfolio.

---

## Decisions resolved

All three open questions from the prior round are now locked. Recorded here so future sessions don't re-derive.

1. **Topic taxonomy.** `'inferensystems'` resolved to `'inference'` and `'systems'` as two separate topics. Final 12-item list in `lib/constants.ts` (see PR #12): `['agents', 'llm', 'vlm', 'rag', 'evals', 'mlops', 'inference', 'systems', 'research', 'medical-ai', 'tools', 'career']`.

2. **MDX directory layout.** `content/case-studies/*.mdx` for case studies; `content/pages/{uses,stack}.mdx` for transparency pages. Two siblings under `content/`.

3. **Publication model fields.** Day-one schema includes the extended set: `authors: String[]`, `venue: String?`, `year: Int`, `url: String?`, `arxivId: String?`, `pdfUrl: String?`, `bibtex: String?`, `doi: String?`, `abstract: String?`, `publishedAt: DateTime?`, `projectId: String?` (relation to `Project`), `topics: String[]`. Schema as specified in PR #12.

4. **`ContactSubmission` vs `Contact`.** Confirmed: `Contact` stays as the singleton site-config row (owner email, socials, availability). New `ContactSubmission` model (PR #12) carries form-submission rows with `engagementType` enum (`Consult` / `Contract` / `FullTime` / `ResearchCollab`). Two distinct tables.
