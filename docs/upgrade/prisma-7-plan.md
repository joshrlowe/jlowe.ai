# Prisma 5 → 7 upgrade plan (jlowe.ai)

Status: PLAN ONLY. Per the broader `cleanup/2026-05-15` ADR, Tier 3 (including Prisma 7)
is deferred past 2026-05-31. Do not execute against `main` until that gate is lifted.

Current state (verified on this branch):

- `prisma@^5.20.0` / `@prisma/client@^5.20.0` (lockfile pins 5.22.0 per task context)
- `prisma/schema.prisma` uses `generator client { provider = "prisma-client-js" }`
  with the implicit `node_modules/@prisma/client` output path
- Datasource URL pulled from `DATABASE_URL` (fallback `PRISMA_DATABASE_URL`)
- Five committed migrations including hand-written pgvector / tsvector / trigger DDL
- 19 models; 8+ files import from `@prisma/client`; raw SQL pgvector + tsvector
  workflow lives in `lib/rag/{upsert,vector-search}.ts`
- `pages/api/chat.ts` uses `prisma.$transaction([...])` array form
- `package.json` already has `"type": "module"` and `tsconfig.json` uses
  `module: "esnext"`, `moduleResolution: "bundler"` — good
- `next-auth` is JWT-session (`session: { strategy: "jwt" }`), NOT DB-session, so
  there is no Prisma adapter in the auth path — only `prisma.adminUser.findUnique`
  inside the credentials `authorize` callback
- Vercel runs `prisma migrate deploy` at build time via `postinstall`
- Supabase pooler on :6543 for runtime + direct :5432 (`PRISMA_DATABASE_URL`)
  for migrations

---

## 1. Pre-flight checks

Before opening any branch:

1. **Confirm gating ADR has been lifted.** Tier 3 deferral expires after
   2026-05-31; do not start until ADR explicitly allows it.
2. **Confirm Node.js runtime ≥ 20.19.0** in three places:
   - Local dev (`node --version` ≥ 20.19; currently v24.10 — fine)
   - Vercel project setting (Build & Development → Node.js Version)
   - `package.json` `engines.node` (currently missing — add `">=20.19"` before
     the upgrade so Vercel won't silently downgrade)
3. **Confirm TypeScript ≥ 5.4.0** (currently `^5.9.0` — fine)
4. **Take a fresh logical backup of production Postgres** before applying any
   migration cycle (`pg_dump --no-owner --no-acl` from Supabase direct URL).
5. **Verify Bedrock Titan v2 is still reachable** so embeddings smoke tests can
   pass after the cutover (`scripts/test-prisma-connection.js` covers DB, but
   the RAG smoke test needs Bedrock access).
6. **Audit schema invariants** that must survive the migration:
   - `KnowledgeChunk.id` is `String @id` with NO `@default` — the JS layer
     (`randomUUID()` in `lib/rag/upsert.ts`) supplies the id by raw INSERT.
     Do not introduce `@default(cuid())` — it would change ids on insert paths
     that use Prisma helpers and silently bypass the raw-SQL pipeline.
   - `KnowledgeChunk.embedding` is `Unsupported("vector(1024)")` — required so
     Prisma doesn't try to bind it.
   - `KnowledgeChunk.tsv` is `Unsupported("tsvector")` — populated by Postgres
     trigger `knowledge_chunks_tsv_update`. The trigger lives in migration
     `20260501150000_add_knowledge_chunks/migration.sql`.
   - `migration_lock.toml` provider is `postgresql`.
7. **Verify no `prisma.$use`, `prisma.$on('query')`, or `prisma.$metrics`
   usage in app code.** Grep across `lib/`, `pages/`, `scripts/`,
   `components/` returned 0 matches. The mock at `__mocks__/@prisma/client.js`
   defines `$use` and `$on` as no-ops — only the mock surface uses the removed
   APIs, so no production migration work is needed for middleware/metrics.
8. **Verify no `Prisma.validator(...)` calls.** Grep returns 0.
9. **Verify no `rejectOnNotFound` constructor option.** `lib/prisma.ts` only
   sets `log`; clean.
10. **Cross-check `__mocks__/@prisma/client.js`** — the Jest mock currently
    exports `Prisma` and `PrismaClient` from `@prisma/client`. After moving to
    a generated output path (see Step 4 below), Jest mocking by module name
    will need to be re-pointed.

---

## 2. Breaking changes that actually hit jlowe.ai

Filtered down from the full v6/v7 release notes to what THIS codebase exercises.

### 2a. v5 → v6 (incremental gate)

Prisma 6 is the floor that introduces several deprecations and bumps Node/TS
minimums. We must pass through it because v7 removes things that v6 only
deprecates. Specific to jlowe.ai:

- **Node.js ≥ 18.18 enforced** (we're already on 24.x; fine)
- **TypeScript ≥ 5.1 enforced** (we're on 5.9; fine)
- **`Buffer` ↔ `Uint8Array` change for `Bytes`** — we have NO `Bytes` columns
  in the schema, so this is a no-op.
- **`NotFoundError` removed** — we don't import it; clean.
- **Implicit m-n relations require explicit assignment table when extended**
  — our only join tables (`ProjectTeamMember`, `PlaylistPost`, `CommentVote`)
  are already explicit. No-op.
- **Full-text search preview feature renamed** — we don't use `fullTextSearch`
  preview in the generator; we built our own tsvector path. No-op.

Net effect: v6 is essentially a free install for us — no code changes required.

### 2b. v6 → v7 (the real work)

| Change | Affects | Files we touch |
|---|---|---|
| `generator client` provider renamed to `prisma-client`, `output` is **required** | schema | `prisma/schema.prisma` |
| Driver adapter is **required** for SQL providers; native engine removed | runtime | `lib/prisma.ts`; new dep `@prisma/adapter-pg`, `pg` |
| `prisma.config.ts` is the single source for CLI config; `url`/`directUrl` in `datasource` block deprecated | CLI config | new file `prisma.config.ts`; trim `schema.prisma` `datasource` block; `package.json` adds `dotenv` import path |
| **No auto env loading** — CLI no longer reads `.env` implicitly | CLI / scripts | `prisma.config.ts` imports `'dotenv/config'`; existing `dotenv.config()` calls in `scripts/*.js` are still needed (they already exist) |
| All `@prisma/client` imports must change to the generated output path | every Prisma consumer | 14 files (list below) |
| `Prisma.validator()` removed | type helpers | 0 occurrences — no-op |
| `prisma.$use` middleware removed → use `$extends` | app | 0 occurrences — no-op |
| `prisma.$metrics` preview removed | observability | 0 occurrences — no-op |
| `prisma migrate dev` no longer auto-runs `generate` or `db seed` | CI/CD | `package.json` build script; Vercel `postinstall` |
| Several CLI flags removed (`--skip-generate`, `--skip-seed`, `--from-url`, `--to-url`, etc.) | CLI scripts | none of our `package.json` scripts use these flags — clean |
| `rejectOnNotFound` constructor option removed | client init | 0 occurrences — no-op |
| ESM-first; `moduleFormat = "cjs"` available as opt-in | client output | `package.json` already has `"type": "module"` and tsconfig is ESM-compatible — we should target ESM (default), NOT set `moduleFormat = "cjs"` |
| New entrypoints: `client` / `browser` / `models` / `enums` | consumer imports | mostly cosmetic for us; server-only — all consumers import from `client` |

#### Full list of import sites that must be updated

These all currently `import { ... } from "@prisma/client"` and will need to
import from the generated output (e.g. `from "@/generated/prisma/client"`):

- `lib/prisma.ts` — `PrismaClient`
- `lib/types.ts`
- `lib/utils/activityLogger.ts` — `Prisma` (namespace, for `JsonNull` /
  `InputJsonValue`)
- `lib/utils/projectStatusMapper.ts` — `type ProjectStatus`
- `lib/rag/upsert.ts` — `Prisma` (for `Prisma.sql` tag)
- `lib/rag/sources.ts` — type imports `About`, `Contact`, `Post`, `Project`,
  `Welcome`
- `lib/rag/vector-search.ts` — `Prisma` (for `Prisma.sql` tag)
- `pages/api/comments/index.ts` — `Prisma`
- `pages/api/admin/comments/index.ts` — `Prisma`
- `pages/api/admin/projects/import.ts` — `type Prisma`
- `scripts/test-prisma-connection.js` — `PrismaClient`
- `scripts/seed-admin.js` — `PrismaClient`
- `scripts/seed-content.js` — `PrismaClient`
- `scripts/migrate-data.js` — `PrismaClient`
- `scripts/migrate-resources-to-posts.js` — `PrismaClient`

15 import sites total. Mechanical rewrite. Consider adding a path alias
`"@/db"` → `"./generated/prisma/client"` in `tsconfig.json` to avoid baking
a deep relative path into every consumer.

#### Files that also need touching for the adapter wiring

- `lib/prisma.ts` — instantiate `new PrismaClient({ adapter })` with
  `PrismaPg` constructed from `DATABASE_URL`. Keep the global-singleton
  pattern for hot-reload. Keep `log: logConfig`.
- `__mocks__/@prisma/client.js` — repoint Jest mock target to the new module
  specifier OR keep the current mock and add a second mock entry in
  `jest.config.js` `moduleNameMapper` that maps the generated path to the
  same mock implementation.

---

## 3. Migration steps in order (per-commit sequence)

Execute on a dedicated branch (suggested: `upgrade/prisma-7`). Every step
below is intentionally one commit so it can be reverted independently. Run
the full test suite (`npm run lint`, `npm test`, `npm run build`) at each
checkpoint marked **CHECKPOINT**.

### Phase A — Bump to v6 first (gate)

> Going direct from 5 → 7 mixes too many changes in one commit and obscures
> root-cause when something breaks. Pass through v6 to isolate `prisma-client`
> generator + driver-adapter changes from anything v6 introduced.

**Commit A1 — bump packages**
```bash
npm install prisma@^6 @prisma/client@^6
```
- Run `npm run prisma:generate` locally; commit `package-lock.json`.
- Run `npm run lint && npm test`. Expect green; no API surface changes in
  app code at this stage.
- **CHECKPOINT**: deploy to a Vercel preview, smoke-test admin login + chat
  funnel.

If preview is green, proceed. If anything fails here, fix in v6 land before
touching v7 — v7 will only add more variables.

### Phase B — Schema + config groundwork (v6, in-place)

**Commit B1 — add `engines.node`**

Add to `package.json` so Vercel locks Node ≥ 20.19:
```json
"engines": { "node": ">=20.19" }
```

**Commit B2 — add `prisma.config.ts` (v6-compatible, optional)**

Prisma 6 supports `prisma.config.ts` already. Create it now so the v7 cutover
is a smaller diff:

```ts
// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Use the direct connection for CLI (migrations). Runtime app uses the pooler.
    url: env('PRISMA_DATABASE_URL') ?? env('DATABASE_URL'),
  },
});
```

Note the URL choice: jlowe.ai currently uses `PRISMA_DATABASE_URL`
(port 5432, direct) for migrations and `DATABASE_URL` (port 6543, pooler) at
runtime. The CLI must use the direct connection — pooler can drop long
DDL transactions mid-migration.

Verify locally with `npx prisma migrate status`. Do NOT delete the
`url = env("DATABASE_URL")` line from `schema.prisma` yet — Prisma 6 still
expects it. We'll remove it in the v7 commit.

### Phase C — Cut over to v7

**Commit C1 — bump packages and install adapter**
```bash
npm install prisma@^7 @prisma/client@^7
npm install @prisma/adapter-pg pg
npm install --save-dev @types/pg
```

**Commit C2 — update `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
  // moduleFormat defaults to "esm"; we want ESM since package.json sets
  // "type": "module".
}

datasource db {
  provider = "postgresql"
  // url removed; lives in prisma.config.ts now
}
```

Run `npx prisma generate`. Verify `generated/prisma/` is created with
`client.ts`, `models.ts`, `enums.ts`, `browser.ts`.

**Commit C3 — `.gitignore` the generated client**

```
/generated/prisma
```

(Or commit it — pick one and document it. Recommended: gitignore it and have
`postinstall` keep regenerating, matching today's behaviour where the
node_modules client is regenerated at install.)

**Commit C4 — rewrite `lib/prisma.ts` for driver-adapter**

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logConfig: Array<"query" | "error" | "warn" | "info"> =
  process.env.NODE_ENV === "development"
    ? process.env.PRISMA_LOG_QUERIES === "true"
      ? ["query", "error", "warn"]
      : ["error", "warn"]
    : ["error"];

function makePrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: logConfig });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

**Commit C5 — update all 15 import sites**

Mechanical s/`@prisma/client`/`@/generated/prisma/client`/g across the list
in section 2b. Run `npm run lint && npm test`.

If using a path alias (recommended), add to `tsconfig.json`:
```json
"paths": {
  "@/*": ["./*"],
  "@/db": ["./generated/prisma/client"]
}
```
and use `import { PrismaClient, Prisma } from "@/db"`. This means a single
future move only edits the alias.

**Commit C6 — repoint Jest mock**

Update `jest.config.js` `moduleNameMapper`:
```js
"^@prisma/client$": "<rootDir>/__mocks__/@prisma/client.js",
"^@/generated/prisma/client$": "<rootDir>/__mocks__/@prisma/client.js",
"^.*/generated/prisma/client$": "<rootDir>/__mocks__/@prisma/client.js",
```
(Keep the `@prisma/client` line as a safety net for any third-party that
still pulls it.)

Also: the mock at `__mocks__/@prisma/client.js` defines `$use` and `$on` —
these are removed in v7 runtime. The mock can keep them (tests never assert
on their absence) but mark with a TODO comment to drop after v7 land.

**Commit C7 — update `package.json` scripts and `postinstall`**

- `postinstall` already runs `prisma generate` — still correct in v7.
- `build` script chains `prisma generate && next build` — still correct.
- No script uses `--skip-generate` or `--skip-seed` (verified).
- Add explicit seed step where needed (v7 no longer auto-seeds after
  `migrate reset`): we don't currently auto-seed in `npm run prisma:migrate`,
  so this is a no-op. The existing `npm run seed:admin` is invoked manually.
- Verify `prisma migrate deploy` (Vercel build step) still picks up
  `prisma.config.ts` — it does as of 7.x.

**Commit C8 — full local verification**

1. `npm install` (triggers `postinstall` → `prisma generate`)
2. `npm run lint`
3. `npm test` (Jest)
4. `npm run build` (Next + `prisma generate`)
5. `npm run dev` + manual smoke (see test plan, section 6)

**CHECKPOINT**: Deploy to a Vercel preview branch. Verify:
- Admin login flow (`/admin/login`)
- An admin write that touches `prisma.$transaction` (project create/update)
- A chat request that exercises `pages/api/chat.ts` `$transaction([...])` array
- An RAG query that exercises raw `$queryRaw` pgvector + tsvector
- An `Inngest`-driven re-embed that exercises raw `$executeRaw` insert

### Phase D — Cleanup

**Commit D1 — drop `__mocks__` shims that are no longer needed**

If the v6 → v7 transition introduces any test failure, the fix lives in
this commit. Otherwise: no-op.

**Commit D2 — remove `dotenv` from any places it duplicates `prisma.config.ts`**

(Scripts under `scripts/` still need explicit `dotenv.config()` — leave those.)

---

## 4. pgvector / tsvector compatibility under v7

This is the highest-risk area and was the explicit reason the schema uses
`Unsupported("vector(1024)")` / `Unsupported("tsvector")` + hand-written
migrations + raw SQL.

**Good news:**

- `prisma.$queryRaw` and `prisma.$executeRaw` (with `Prisma.sql` template
  tag) are preserved verbatim in v7. The `Prisma` namespace just moves to
  the generated path; the API surface is unchanged.
- The `pg` driver (used by `@prisma/adapter-pg`) is the official Postgres
  driver and is the underlying driver Prisma 5/6 used internally for many
  operations — `vector`, `tsvector`, and array types all round-trip
  cleanly through it. No special casts beyond what we already do
  (`${vec}::vector`, `${headingPath}::text[]`).
- `Unsupported(...)` in the schema continues to work — it just tells Prisma
  "don't generate selectors for this column, don't try to bind it." That
  remains correct on v7.
- The Postgres trigger that auto-populates `tsv` runs server-side; the
  client doesn't see it. Driver change is irrelevant.
- The HNSW index (`USING hnsw (embedding vector_cosine_ops)`) is server-side
  DDL, unchanged.

**Things to verify in a preview env:**

1. **Cosine operator round-trip** — confirm `1 - (embedding <=> ${vec}::vector)`
   still returns `number` when destructured into `SemanticRow.semantic_score`.
   The `pg` driver may type Postgres `double precision` as `string` if the
   parser is set conservatively; cast to `float8` or call `Number(...)` if
   so. Today's `prisma@5` route returns numbers; if `pg`'s default parser
   diverges, this is the one spot likely to need a `parseFloat` defensive cast.
2. **`text[]` binding** — `${chunk.headingPath}::text[]` in `upsert.ts` must
   continue to serialize correctly. `pg` natively supports JS arrays for
   `text[]` parameters; should be a no-op.
3. **`vector` parameter binding** — we pass `'[0.1,0.2,...]'::vector` as a
   string + cast. This is a string parameter and a cast — unaffected by
   driver change.
4. **Transaction semantics** — `prisma.$transaction(async (tx) => { ... })`
   in `lib/rag/upsert.ts` and the array form `prisma.$transaction([...])`
   in `pages/api/chat.ts` both remain supported in v7. The `tx.$executeRaw`
   inside the upsert closure still works.

**Action items for this section:**

- Add a one-off integration test (or extend an existing one) that does:
  1. Insert one `KnowledgeChunk` via raw SQL with a known embedding
  2. Query via `<=>` cosine operator
  3. Assert the returned `semantic_score` is `number` not `string`

  This is the cheapest insurance against a silent v7 + pg type-parser regression.

---

## 5. Rollback plan

The branch must be revertible at every commit boundary listed in section 3.

**If C1–C2 (package bump + schema edit) fails:**
- `git revert` the commits, `rm -rf node_modules generated`, `npm install`.
- Vercel preview should self-heal on next deploy.

**If C4–C5 (import rewrites) fails at build:**
- Same as above. Imports are mechanical; pinpoint the broken consumer
  via the TypeScript error and fix forward OR revert.

**If C8 (preview deploy) fails at runtime:**
- The driver-adapter is the most likely culprit. Check Vercel logs for
  `PrismaPg` connection errors. If the pooler URL is being passed where the
  direct URL should be, fix `lib/prisma.ts` to read the correct env.
- **Database state is safe** — no migration was run during the v7 upgrade.
  Migrations in `prisma/migrations/` are untouched. Reverting the code
  branch fully restores prior behaviour.

**If a NEW migration was needed during the upgrade (it shouldn't be):**
- Do not auto-rollback DB migrations. If a migration was applied to
  production by mistake, plan a forward fix migration. Prisma never
  generates DOWN scripts; the `_lost_baseline` recovery procedure is
  documented at <https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining>.

**Bedrock / pgvector specifically:**
- The HNSW index, trigger, and pgvector extension are migration-applied DDL.
  None of them change in this upgrade. If you somehow drop the index during
  testing, recreate with:
  ```sql
  CREATE INDEX knowledge_chunks_embedding_hnsw
    ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
  ```

---

## 6. Test plan

Run in this order on the preview deploy after Commit C8.

### Unit (Jest)
- `npm test` — full suite must pass. The Prisma mock at
  `__mocks__/@prisma/client.js` is the failure point if `moduleNameMapper`
  in `jest.config.js` wasn't updated (C6).
- `npm run test:coverage` — coverage thresholds (70% global) should hold;
  no source-line counts changed materially.

### Lint / typecheck
- `npm run lint`
- `npm run lint:nocheck` — must still find zero `@ts-nocheck`.

### Build
- `npm run build` — must complete end-to-end. This regenerates the client
  and runs Next.js build; any missed import will surface as TS error.

### Smoke: admin login
1. Visit `/admin/login`
2. Submit valid credentials seeded via `npm run seed:admin`
3. Confirm redirect to `/admin` and JWT cookie set
4. Confirm `prisma.adminUser.findUnique` in
   `pages/api/auth/[...nextauth].ts` returns the row (check logs)
5. Confirm the protected `/admin/comments` page loads — this proves
   middleware + `prisma.comment.findMany` both work end-to-end

### Smoke: admin write (`$transaction` via array)
1. From `/admin/projects`, create a new project
2. Verify `activityLogs` row written via `lib/utils/activityLogger.ts`
   (the `Prisma.JsonNull` / `Prisma.InputJsonValue` types come from the
   newly generated namespace — if these break, the import path is wrong)

### Smoke: chat (`$transaction` array form)
1. `POST /api/chat` with a simple user message
2. Verify SSE response streams `text` events, then `citations`
3. Check `chat_messages` table has user + assistant rows
4. Check `chat_sessions` row updated with `qualified`, `topIntent`,
   `langfuseTraceIds`

### Smoke: RAG raw SQL
1. From an `/articles/...` page, ask the chat a question that requires
   retrieval
2. Server logs should show vector + keyword search firing (`lib/rag/
   vector-search.ts`)
3. Citations array in response should be non-empty
4. Verify `1 - (embedding <=> ...)` returned a numeric `semantic_score`
   (Langfuse span `vector_search` will show the count of returned rows)

### Smoke: embedding re-index (raw `$executeRaw` insert)
1. Edit an `About` field via the admin
2. Watch Inngest dev dashboard (`http://localhost:8288`) for
   `content/about.updated`
3. Watch `regenerateEmbeddings` function execute
4. Verify new `knowledge_chunks` rows have populated `tsv` (trigger)
   and `embedding` (raw insert)

### Smoke: migration command
- `npx prisma migrate status` against the preview DB — must show
  zero pending migrations.
- `npx prisma migrate dev` (with `prisma.config.ts` in place) should
  detect no schema changes and exit cleanly.

---

## 7. Known unknowns

Things I could not verify without actually executing the upgrade locally.
Flag these before starting:

1. **`pg`-driver type parsing for `double precision`.** Prisma's native
   engine returned `number` for `semantic_score`; the `pg` driver may
   default to `string` for high-precision numerics. Need to test step
   4 of the pgvector verification above. If `string`, add a numeric
   parser at the call site or set `pg.types.setTypeParser`.

2. **`prisma.config.ts` + Vercel build env interaction.** `prisma.config.ts`
   imports `'dotenv/config'`, but Vercel doesn't ship `.env` to the build
   image — it injects env vars via the platform. The `dotenv/config`
   import should be a no-op in that environment, but a corner case is
   any local-dev script that runs *before* `dotenv` would otherwise have
   loaded. Verify Vercel `postinstall` step still reads `DATABASE_URL`
   correctly with the new config file.

3. **`@prisma/adapter-pg` connection pooling vs Supabase pooler URL.**
   Our `DATABASE_URL` already points at the Supabase pooler on :6543. The
   `pg` driver's own pool will then layer on top of the Supabase pooler.
   Need to test under load (e.g. 10 concurrent `/api/chat` requests) that
   we don't exhaust connection budget. May need to set `max: 5` on the
   adapter to constrain.

4. **HNSW index behaviour with `pg` driver under v7.** The query path uses
   `ORDER BY embedding <=> ${vec}::vector LIMIT 20`. The HNSW index is
   used automatically when the cast is correct. Need to `EXPLAIN ANALYZE`
   on the preview env to confirm the index is still picked up. Driver
   change shouldn't affect planner behaviour but worth verifying.

5. **Jest `transformIgnorePatterns` with the new generated client path.**
   The generated client may include ESM-only deps under `generated/prisma/`.
   If Jest complains about syntax in `generated/prisma/*`, add the path
   to `transformIgnorePatterns` or move the generation root outside the
   project (e.g. `node_modules/.prisma-generated/`).

6. **Cross-driver behaviour of `Prisma.sql` tag.** The tag itself produces a
   pre-parameterized SQL string. v7's `prisma-client` generator might
   re-export `Prisma.sql` from a slightly different module path. Need to
   verify all four `Prisma.sql` consumers (`lib/rag/upsert.ts`,
   `lib/rag/vector-search.ts` x3 sites — sem/keyword × with/without filter)
   compile.

7. **`next-auth` v4 compatibility with v7-generated Prisma client.** We
   are on JWT-session, not DB-session, so there's no NextAuth Prisma
   adapter to worry about. The only Prisma call in the auth path is
   `prisma.adminUser.findUnique` in the credentials provider. Should
   "just work" but verify a login round-trip after Commit C5.

8. **`scripts/*.js` ESM/CJS interop.** Scripts use `import { PrismaClient }`
   and run via `node scripts/seed-admin.js`. With `"type": "module"` in
   `package.json` they already run as ESM. After Commit C5, the import
   path becomes `import { PrismaClient } from "../generated/prisma/client.js"`
   (note the `.js` may be needed under ESM Node resolution). May need to
   tweak the import specifier per script. Mitigation: convert these scripts
   to `tsx` (like `build:embeddings`) so resolution is bundler-style.

9. **`prisma migrate deploy` on Vercel + `prisma.config.ts`.** The build
   step today is implicit (runs from `postinstall` → `prisma generate`).
   `migrate deploy` is NOT in our build script — is it run? Need to grep
   `vercel.json` and the Vercel project settings. If it's a project-level
   "Build Command" override or "Install Command" hook, make sure it
   continues to find `prisma.config.ts` (which it will, since the file
   lives at the project root).

10. **MongoDB callouts.** Skill explicitly warns NOT to migrate MongoDB
    projects to v7. We have a `mongodbUrl` field in `lib/config.ts` but
    `grep -r mongodb` shows it's only read as an optional config — no
    Prisma usage. Confirmed not a blocker.

---

## Summary

- **Multi-step path required:** 5 → 6 → 7. Pass through v6 to isolate
  failures from the much larger v7 cutover. v5 → v6 should be a near-no-op
  for jlowe.ai.
- **Biggest blocker:** the generated-client + driver-adapter rewrite touches
  15 import sites + the singleton in `lib/prisma.ts` + the Jest mock module
  mapping. Mechanical but easy to miss one; gate behind type-check.
- **Highest-risk surface:** the four `Prisma.sql` raw-SQL call sites in
  `lib/rag/`, specifically the `pg`-driver type-parser behaviour for
  `double precision` returned by `1 - (embedding <=> ...)`. Verify with an
  integration test against a real Postgres.
- **No DB migrations are part of this upgrade.** Schema stays identical at
  the SQL level; only the generator changes how the client is emitted.
