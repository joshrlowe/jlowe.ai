# Portfolio — jlowe.ai

Standing orders. Read every session.

## Identity

Portfolio for Josh Lowe (jlowe.ai) — AI/ML engineer credibility site. Primary audience: hiring managers evaluating AI/ML roles (Leidos-style), research collaborators (UCF AI MIND Lab and beyond), Kronyx 2.0 / BidOps prospective buyers. Secondary: consulting and SaaS lead gen. Not: general creative-dev portfolio.

## Stack (locked)

- **Framework:** Next 16 App Router only. No Pages Router survivors.
- **Language:** TypeScript strict. `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`. No `any` outside third-party boundaries; any remaining `any` requires a one-line `// eslint-disable-next-line` + rationale.
- **React:** 19.
- **Styling:** Tailwind v4 via `@tailwindcss/postcss`. CSS variables in `app/globals.css` `@theme` block. No CSS Modules in new code. No styled-components / Emotion.
- **UI primitives:** shadcn/ui (code-owned, Radix-backed). No MUI / Chakra / Mantine / HeroUI. Hand-rolled primitives only when shadcn doesn't cover the need.
- **Database:** PostgreSQL via Prisma 6. Single `lib/prisma.ts` singleton.
- **Auth:** Auth.js 5 (`next-auth@5`). Credentials provider; JWT strategy; `auth.ts` at repo root; `middleware.ts` uses `auth()` helper.
- **Hosting:** Vercel.
- **Analytics:** `@vercel/analytics` only. Custom events defined in `lib/analytics.ts`.
- **Syntax highlighting:** Shiki via `rehype-pretty-code`. No `prismjs`, no `react-syntax-highlighter`.
- **Markdown for blog:** `react-markdown` + `remark-gfm` + `rehype-pretty-code`.
- **Case studies:** MDX under `content/case-studies/*.mdx`. Rendered in App Router with shared `mdx-components.tsx`.
- **Transparency pages:** MDX under `content/pages/{uses,stack}.mdx`.
- **Resume PDF:** generated with `@react-pdf/renderer` (script under `scripts/generate-resume.ts`) to `public/resume.pdf` on build + admin-About-save webhook.
- **Booking:** Cal.com inline embed via `@calcom/embed-react`.
- **Validation:** Zod for API route input validation.
- **Testing:** Jest 30 + `@testing-library/react` 16 + `jest-axe` for unit; Playwright 1.57 + `@axe-core/playwright` for e2e + a11y; Lighthouse CI for perf/SEO regression.
- **Animation:** GSAP + ScrollTrigger for scroll animations. Vanilla canvas (`components/TokenStreamBackground.tsx`) for the hero. No Three.js, no R3F, no Drei.
- **Node:** `>=20.0.0` (pinned in `package.json` `engines`, `.nvmrc` with `20`).
- **Package manager:** npm.

## Constants (locked)

- **`TOPIC_OPTIONS`** (in `lib/constants.ts`) — the only allowed values for `Post.topic` and case-study frontmatter `topic`:
  ```
  ['agents', 'llm', 'vlm', 'rag', 'evals', 'mlops', 'inference',
   'systems', 'research', 'medical-ai', 'tools', 'career']
  ```
  Do not add a new topic without adding it here first; both admin write paths and public filters import from this single source.
- **`Contact` vs `ContactSubmission`.** Two distinct Prisma models. `Contact` is a singleton config row holding the site owner's email/phone/socials/availability — populated once via the admin Settings panel. `ContactSubmission` is the form-submissions table — every visitor inquiry from `/contact` writes a row carrying an `engagementType` enum (`Consult` / `Contract` / `FullTime` / `ResearchCollab`). Never mix them; a refactor that removes one breaks the other.

## Directory conventions

```
app/                     # App Router routes and layouts
  (public)/              # optional route group for public pages
  admin/                 # admin shell + routes
  api/                   # route handlers (*.route.ts)
  [route]/
    page.tsx
    layout.tsx           # when needed
    loading.tsx
    error.tsx
    opengraph-image.tsx  # per-route OG card when custom
components/
  ui/                    # shadcn/ui primitives (machine-generated + tweaked)
  markdown/              # MarkdownContent + MDX component map
  projects/              # project-domain components
  admin/                 # admin-only components (grouped by feature)
  case-studies/          # case-study-specific components
  TokenStreamBackground.tsx
  JsonLd.tsx
content/
  case-studies/
    kronyx-2.mdx
    bidops.mdx
    cardiovlm.mdx
  pages/
    uses.mdx
    stack.mdx
lib/
  prisma.ts              # singleton
  auth.ts                # or kept at repo root
  config.ts              # env + runtime config
  analytics.ts           # event catalog + helpers
  constants.ts           # TOPIC_OPTIONS, ANALYTICS_EVENTS names, enum mirrors
  queries/               # Prisma query helpers colocated by domain
  utils/                 # pure helpers
  hooks/                 # client-side hooks
  markdown/
    config.ts            # remark/rehype plugin config reused by MDX + blog
types/
  global.d.ts
  content.ts             # shared JSON-field shapes
  api.ts                 # API response shapes
prisma/
  schema.prisma
scripts/
  generate-resume.ts
  seed-admin.ts
  seed-content.ts
__tests__/
e2e/
public/
  resume.pdf             # auto-generated, do not hand-edit
mdx-components.tsx       # App Router MDX component map (root-level convention)
auth.ts                  # Auth.js 5 config
middleware.ts
next.config.ts
tsconfig.json
.nvmrc
```

## Code conventions

- **Exports:** named exports outside Next.js route conventions (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `middleware.ts`, `opengraph-image.tsx` — all default-exported per framework requirement). Elsewhere, named exports only.
- **Barrels:** no barrel files (`index.ts` re-exports) except inside `components/ui/` where shadcn manages them. Deep-import from source files.
- **Client components:** `"use client"` pragma on line 1. Next line is a one-sentence comment explaining the interactivity that requires it (state, ref, event handler, browser API).
- **Server by default.** If a component doesn't need client APIs, it's a Server Component. Prefer data fetching in Server Components (Prisma direct, `fetch` with `cache`).
- **Prisma:** query helpers live in `lib/queries/<domain>.ts`, not inlined in routes (except trivial single-line reads).
- **Analytics:** emitted from the component that owns the interaction. Do not emit from parent wrappers.
- **Styling:** Tailwind utilities. Tokens come from `app/globals.css` `@theme`. No inline `style={{ ... }}` except for computed dynamic values (e.g., `style={{ transform: \`translateY(${y}px)\` }}`).
- **CSS:** no CSS Modules in new code. If a style can't be expressed in Tailwind, add it to `app/globals.css` under a clearly labeled section.
- **localStorage / sessionStorage / window:** only inside `useEffect` (or a `typeof window !== 'undefined'` guard); never during render.
- **Images:** `next/image` with explicit `width`/`height` or `fill` + parent-container sized. No `<img>` tags.
- **Links:** `next/link` for internal; `<a target="_blank" rel="noopener noreferrer">` for external.
- **Tests:** Jest + RTL for components and utilities; Playwright for page-level and e2e; axe on every new route.
- **Naming:** `PascalCase.tsx` for components, `camelCase.ts` for utilities, `kebab-case.mdx` for content files.

## Content pillars and featured projects

Three flagships; every other project orbits these in narrative weight.

- **Kronyx 2.0** — production AI platform. Lead case study in `content/case-studies/kronyx-2.mdx`.
- **BidOps** — agentic bidding engine. `content/case-studies/bidops.mdx`.
- **CardioVLM** — vision-language model research. **Status: research in progress.** Affiliation: **UCF AI MIND Lab.** Acknowledge advisor in frontmatter and page. `content/case-studies/cardiovlm.mdx`.

Every public page should reinforce AI/ML positioning — not general web-dev.

## Voice

- Candid. Technically direct. No marketing fluff. No emoji anywhere (code, markdown, UI copy).
- Short paragraphs. Numbers when they exist; "in progress" when they don't.
- Don't promise metrics that aren't measured. Don't puff "production-grade" without shipping evidence.
- Writing in case studies: problem → constraints → approach → what broke → what we measured → what's next.

## Quality gates (must pass before merge)

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` clean.
- `npm run test:coverage` — no coverage regression.
- `npm run test:e2e -- --project=chromium` green.
- Lighthouse CI non-regressing vs prior PR baseline.
- Axe green on any new public route.
- Bundle size delta documented when a dep is added or removed.

## Model policy (when in doubt)

- Prefer Shiki over hand-rolled syntax highlighting.
- Prefer Tailwind tokens from the `@theme` block over ad-hoc colors.
- Prefer shadcn primitives over hand-rolled UI.
- Prefer Prisma queries in `lib/queries/<domain>.ts` over inline in routes.
- Prefer RSC over Client Components.
- Prefer the Metadata API over manual `<Head>` / SEO components.
- Prefer MDX under `content/` for long-form; prefer Prisma `Post` for CMS-authored short-form.

## Things NOT to do

- No `any` without an eslint-disable + one-line rationale.
- No CSS Modules in new code.
- No hand-rolled modals / dropdowns / toasts / comboboxes — use shadcn.
- No `localStorage` / `sessionStorage` / `window.*` during render — always in `useEffect` or guarded.
- No new runtime dependencies without a one-line rationale comment in the PR description.
- No barrel files outside `components/ui/`.
- No adding `react-toastify`, `prismjs`, `marked`, `react-syntax-highlighter`, `three`, `@react-three/*` back.
- No Pages Router files (`pages/` directory). If you see one, it's a migration leftover — delete.
- No default exports outside Next.js route conventions.
- No inline `<Head>` tags — use `generateMetadata`.
- No hardcoded URLs — derive from `lib/config.ts`.
- No emoji in code, commits, PR titles, UI copy, or markdown content.
- No coverage-chasing. 70 % threshold is aspirational; don't write tests to hit it.
- No i18n. Single-language site.
- No TypeScript assertions (`as X`) except for JSON.parse / external-boundary narrowing — prefer type guards.
- No committing generated artifacts except `public/resume.pdf` (regenerated on build).

## Active projects (for content-authoring sessions)

- **Kronyx 2.0.** Production AI platform. One-sentence positioning to be finalized by Josh post-merge. Stack: TBD. Status: shipped / production.
- **BidOps.** Agentic bidding engine. One-sentence positioning to be finalized by Josh post-merge. Stack: TBD. Status: shipped / private beta / production.
- **CardioVLM.** Vision-language model for cardiac imaging. Stack: PyTorch + Transformers + TBD. **Status: research in progress.** Affiliation: UCF AI MIND Lab. Acknowledge advisor.

## Status flags

- `status: "research in progress"` for CardioVLM and any unpublished research.
- `status: "production"` only for deployed systems.
- `status: "private"` for work that can't be linked publicly.

## Current file references to respect

- `lib/analytics.ts` — event catalog; all custom events named here.
- `lib/hooks/usePrefersReducedMotion.ts` — reuse for any animation.
- `lib/hooks/useReadingAnalytics.ts` — reuse on long-form pages.
- `lib/utils/projectTransformer.ts` — Prisma → public-shape conversion for projects.
- `components/JsonLd.tsx` — structured-data emitter.
- `components/TokenStreamBackground.tsx` — hero background component; don't replace without good reason.
- `app/globals.css` `@theme` block — single source of design tokens.
- `content/` — MDX content; schema-free aside from frontmatter.
