# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal AI consultancy site (jlowe.ai). Next.js 15 **Pages Router** (not App Router), Prisma + Postgres with pgvector, NextAuth credentials auth, AWS Bedrock for all AI calls, Inngest for background jobs, Langfuse for LLM observability, deployed on Vercel.

## Commands

```bash
npm run dev                 # Next dev server on :3000
npm run build               # Runs `prisma generate` then `next build`
npm run lint                # ESLint (flat config in eslint.config.mjs)
npm run lint:nocheck        # Greps source for @ts-nocheck — fails CI if any reappear

npm test                    # Jest (jsdom env, MSW 2.x optional)
npm test -- path/to/file.test.tsx   # Single file
npm test -- -t "describe/it name"   # Filter by name
npm run test:coverage       # Threshold is 70% in jest.config.js (CI gate is looser; see README)

npm run test:e2e            # Playwright across chromium/firefox/webkit/mobile
npm run test:e2e:ui         # Interactive UI mode

npm run prisma:migrate      # `prisma migrate dev` — interactive, run from a real terminal
npm run prisma:studio       # GUI at :5555
npm run seed:admin          # Create the admin user from ADMIN_EMAIL/ADMIN_PASSWORD env

# Background jobs (Inngest)
npm run jobs:dev            # Inngest dev server. Pair with `npm run dev` in a 2nd terminal.
npm run build:embeddings    # Emit knowledge/reindex.requested → fans out via Inngest
npm run build:embeddings:legacy   # Synchronous, no Inngest required (reference impl)
```

## Architecture

### Routing layout (Pages Router)

- `pages/api/*` — public endpoints. `pages/api/admin/*` — admin endpoints, all wrapped with `withAuth` from `lib/utils/authMiddleware.ts`.
- `middleware.ts` — runtime guard for `/admin/:path*` (redirects to `/admin/login` on missing JWT).
- `lib/auth.ts:requireAuth` always returns `props: {}` — protection lives in middleware, not in `getServerSideProps`. This is intentional to avoid build-time module-loading issues.
- `pages/_app.tsx` swaps layouts: admin (`/admin/*`), design sandbox (`/design/*`, robots-noindex), and default (header + footer + ChatWidget).

### API handler patterns (`lib/utils/`)

- `createApiHandler({ GET, POST, ... })` — method routing + uniform error handling via `handleApiError`.
- `withAuth(handler)` — wraps any handler to require a NextAuth JWT (returns 401 if missing).
- `checkRateLimit(req, res, { maxRequests, windowSeconds, keyPrefix })` — Upstash sliding-window. **Fails open** when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are absent.
- Validators: `validateRequiredFields`, `validateEmail`, `validateMaxLength`, `combineValidations`.

### RAG pipeline (`lib/rag/`)

`sources.ts` (Prisma rows → markdown) → `chunker.ts` (structure-aware) → `embed.ts` (Bedrock Titan v2, 1024-dim) → `upsert.ts` (SHA-256 content-hash gate, atomic delete+insert in a transaction) → query path: `vector-search.ts` runs vector + keyword in parallel, merges via `rrf.ts` (k=60, top-20), then `rerank.ts` reranks to top-K.

The `KnowledgeChunk` model uses raw SQL throughout because **pgvector and tsvector aren't first-class in Prisma**. Important consequences:

- The `id` is generated in JS via `randomUUID()` and injected by raw SQL — Prisma's `@default` is bypassed. Don't rely on Prisma create helpers for inserts.
- The `tsv` column is auto-populated by a Postgres trigger; the migration that creates it is hand-written.
- The `embedding` column is `vector(1024)`; serialize with the `vectorLiteral([...])` helper (`'[0.1,0.2,...]'::vector`).

### Background jobs (`lib/jobs/`, `pages/api/inngest.ts`)

Inngest is the only platform for async work. Functions are registered in the `serve(...)` handler at `pages/api/inngest.ts`. The typed `Events` union in `lib/jobs/events.ts` is the source of truth for event names — adding a new event means updating the union and the function's trigger list.

Local dev requires **two terminals**: `npm run dev` (Next + the serve handler at `/api/inngest`) and `npm run jobs:dev` (Inngest dev server polling that handler). Dashboard at `http://localhost:8288`.

The client tolerates a missing `INNGEST_EVENT_KEY` in dev. Admin API routes wrap every `inngest.send(...)` in `try/catch` so a missing key or transient outage **never breaks the HTTP request** — the warning is logged and the request returns its normal status.

The current function `regenerateEmbeddings` reacts to `content/*.{published,updated,deleted,upserted}` events emitted from admin routes. A `knowledge/reindex.requested` event with no `sourceType` fans out one event per source so they re-embed in parallel under a `concurrency: { limit: 5 }` budget.

### LLM stack

Three Claude variants on Bedrock, hardcoded model IDs:

- **Chat**: `anthropic.claude-3-5-sonnet-20241022-v2:0` (`pages/api/chat.ts`, via `streamChatResponse` in `lib/bedrock/client.ts`).
- **Comment moderation**: `anthropic.claude-haiku-4-5-20251001-v1:0` (`MODERATION_MODEL_ID` constant). Uses `invokeJsonTool` for forced tool-use → typed JSON output.
- **Intent classification**: `anthropic.claude-3-haiku-20240307-v1:0` (`lib/chat/intent.ts`). One call per user message, runs in parallel with retrieval.

Region defaults to `us-east-1` (`AWS_REGION`). AWS credentials are validated lazily inside `assertCredentials()` — failures only surface at the first Bedrock call, not at boot.

### Chat funnel (`/api/chat`)

Streaming SSE endpoint with three event types: `text` deltas, an optional `meeting_booking` event, and a final `citations` event. Pipeline per request:
1. Upsert `ChatSession` keyed on `chat_session_id` cookie (HttpOnly, set by `lib/observability/session.ts`).
2. In parallel: persist user `ChatMessageRow`, classify intent, run RAG.
3. Build system prompt with retrieved context + numbered citations.
4. Expose `book_meeting` tool **only** if intent is `evaluating` and `bookingOffered = false`. Tool input → Cal.com URL via `lib/chat/tools.ts:getCalcomBookingUrl`.
5. Persist assistant message + update session in a single `prisma.$transaction`.

Nightly digest of qualified sessions: `pages/api/cron/qualified-leads-digest.ts`, scheduled in `vercel.json`. Auth: `Authorization: Bearer ${CRON_SECRET}`. **Intentionally on Vercel Cron, not Inngest** (see `lib/jobs/README.md`).

### Comment moderation (`lib/moderation/`)

Every comment scored on four axes (spam/toxicity/offTopic/pii) by Claude Haiku 4.5, then `policy.ts:decide(scores)` routes to `approved` | `held` | `rejected`. Held comments surface in `/admin/comments`.

The legacy `Comment.approved` boolean is kept for backwards compat and **mirrored on every write** as `approved = (moderationStatus === "approved")`. Public reads filter on `moderationStatus = "approved"`; new code should prefer that column.

**Fail-open**: any moderation failure (timeout, Bedrock outage, malformed model output) → status=`held`, model=`"error"`, scores=null. The pipeline never auto-rejects on infrastructure failure.

### Observability (`lib/observability/langfuse.ts`)

Lazy-imported singleton with frozen no-op handles when `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` are missing. Every operation is wrapped in try/catch — observability failures never propagate. The chat handler creates one trace per request and threads it down through `searchKnowledge`, `classifyIntent`, and `streamChatResponse` so all spans nest under one trace.

### Config (`lib/config.ts`)

`getConfig()` is the single entry point for env vars. Required: `DATABASE_URL` (or `PRISMA_DATABASE_URL`), `NEXTAUTH_SECRET`. Optional groups (`langfuse`, `funnel`, `calcom`, `inngest*`) return `null` when their required keys are missing — callers branch on null. AWS credentials are **not** validated here; see "LLM stack" above.

## Critical gotchas

- **Prisma migrations are gitignored.** `prisma/migrations/` is not committed — the schema is the source of truth, each environment regenerates its own migration history. This means schema changes need to be re-applied on every machine. Vercel runs `prisma migrate deploy` at build via `postinstall`.
- **`postinstall` runs `prisma generate`** and `npm run build` runs it again — don't `cp` `node_modules` between machines without re-generating.
- **TypeScript migration is complete** (commit `357d857`). The `lint:nocheck` script greps for `@ts-nocheck` in `components/`, `pages/`, `lib/`, and `middleware.ts` and fails if any reappear. Don't reintroduce them.
- **Jest's `moduleNameMapper` strips explicit `.js` extensions** (`'^@/(.*)\\.js$' → '<rootDir>/$1'`). This is a workaround because source files were migrated to `.ts` while many call sites still write `from "./foo.js"`. If a test fails with "module not found" for a relative import, check the extension mapping.
- **Heavy mocking infrastructure** in `jest.setup.js` and `__mocks__/`: Three.js, react-three/fiber, react-three/drei, GSAP, Prisma, Next.js Image/Link/router/head, react-toastify, react-typed, react-text-transition. The `lib/hooks` mock returns `prefersReducedMotion: true` so animations are skipped. New tests for components touching these libs don't need extra setup.
- **Coverage threshold**: `jest.config.js` says 70% globally; README says CI gate is 50%. Don't be surprised by the discrepancy.
- **Bedrock model access** must be granted per-region in the AWS console. Until granted, `invokeJsonTool` raises `AccessDeniedException` and comment moderation fails open to "held" with `model: "error"`. Smoke test: `aws bedrock-runtime invoke-model --model-id <id> --region us-east-1 ...`.
- **Three.js / GSAP are SSR-pitfalls**: register plugins inside `if (typeof window !== "undefined")` guards. `pages/_app.tsx` already does this for `ScrollTrigger`.
