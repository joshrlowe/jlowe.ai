# Stage 5 — Collapse `v2` into `main`

Make `main` the Velocity tree, turn push-to-`main` deploys back on, and keep a
rehearsed DNS rollback to the frozen v1 Vercel deployment.

This file is **the doc, not the switch.** It does not merge branches, does not
flip `CUTOVER_ENABLED`, does not apply Terraform, and does not force-push
`main`. Stage 4 (apex cutover) already happened; its runbook
([`cutover.md`](./cutover.md)) is kept as history and is **stale in places**
(it still talks about www staying on Vercel, a first prod apply, and
`dns_delegated = false`). Do not execute Stage 4.2/4.3 from that file.

## Current wiring (verified 2026-08-24)

| Thing                                 | Value                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Apex `jlowe.ai` A/AAAA                | CloudFront alias → `d2dbtqktp8rb4p.cloudfront.net` (dist `E1EQ9YM5AH6RFG`)                    |
| `www.jlowe.ai` A/AAAA                 | Same distribution; viewer-request **301 → `https://jlowe.ai/`** (PR #159 applied)             |
| `CUTOVER_ENABLED`                     | `false` (deploys are manual `workflow_dispatch` + env gates)                                  |
| `dns_delegated` in `envs/prod.tfvars` | `true`                                                                                        |
| Route53 hosted zone                   | `Z0012698VM2JOIRL7K4K` (`jlowe.ai.`)                                                          |
| Git rollback snapshot                 | branch `v1-legacy` = tag `v1.0.0` = `ef74fe7` (`chore(main): release 1.0.0 (#109)`)           |
| `origin/main`                         | `074c371` — still the v1 tree, one dependabot commit past `v1.0.0` (#156)                     |
| Last-good Vercel                      | `https://jlowe-ai.vercel.app` — HTTP/2 200, `server: Vercel`                                  |
| Divergence                            | `v2` is **172** unique commits ahead of `main`; `main` is **76** unique commits ahead of `v2` |

Hosted zone id, from a command that was actually run:

```bash
aws route53 list-hosted-zones-by-name \
  --dns-name jlowe.ai \
  --query 'HostedZones[0].Id' \
  --output text
# → /hostedzone/Z0012698VM2JOIRL7K4K
```

---

## 1. Rollback procedure (rehearse on paper)

Emergency rollback is **DNS-only**. It is independent of git, of whether a
merge finished, and of whether a v2 apply half-finished. It is a documented
exception to the Terraform-only rule: speed beats purity.

**Do not `terraform apply` during an emergency rollback.** Prod state still
wants the CloudFront alias A/AAAA (`dns_delegated = true`). An apply would
UPSERT the apex back onto CloudFront and undo the rollback.

### 1.1 Fastest move — Route53 UPSERT + AAAA delete

Two changes, in this order:

1. **UPSERT** the apex **A** to Vercel anycast `76.76.21.21`, TTL 300. This
   replaces the CloudFront alias A (same name + type) atomically; resolvers
   only ever see old-then-new, never NXDOMAIN.
2. **DELETE** the apex **AAAA** CloudFront alias. v1 on Vercel is A-only. If
   the AAAA stays, IPv6 clients keep hitting v2 even after the A points at
   Vercel.

`www` stays on CloudFront. It 301s to `https://jlowe.ai/`, which after step 1
is Vercel. Leave www alone in the emergency path.

```bash
# Hardcoded from the list-hosted-zones-by-name output above.
# change-resource-record-sets accepts the bare id (no /hostedzone/ prefix).
ZONE=Z0012698VM2JOIRL7K4K

# --- 1. Apex A → Vercel ----------------------------------------------------
aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE" \
  --change-batch '{
    "Comment": "emergency rollback: apex A to Vercel 76.76.21.21",
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "jlowe.ai.",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "76.76.21.21"}]
      }
    }]
  }'

# --- 2. Drop the CloudFront AAAA so IPv6 clients do not keep hitting v2 ----
# Alias DELETE must match the live record exactly. Read it, then delete it.
# Verified 2026-08-24: AliasTarget HostedZoneId=Z2FDTNDATAQYW2
# (CloudFront's zone, not ours), DNSName=d2dbtqktp8rb4p.cloudfront.net.
AAAA=$(aws route53 list-resource-record-sets \
  --hosted-zone-id "$ZONE" \
  --query "ResourceRecordSets[?Name=='jlowe.ai.' && Type=='AAAA'] | [0]" \
  --output json)

test "$AAAA" != "null" && test -n "$AAAA"

CHANGE=$(jq -n --argjson rr "$AAAA" \
  '{Comment:"emergency rollback: drop apex AAAA",Changes:[{Action:"DELETE",ResourceRecordSet:$rr}]}')

aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE" \
  --change-batch "$CHANGE"
```

If `jq` is missing, delete with the values verified on 2026-08-24 (re-read
the live record first if the distribution domain has ever rotated):

```bash
ZONE=Z0012698VM2JOIRL7K4K
aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE" \
  --change-batch '{
    "Comment": "emergency rollback: drop apex AAAA",
    "Changes": [{
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "jlowe.ai.",
        "Type": "AAAA",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d2dbtqktp8rb4p.cloudfront.net.",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

### 1.2 Verify the flip

```bash
dig A    jlowe.ai +short @1.1.1.1     # → 76.76.21.21  (not CloudFront edge IPs)
dig AAAA jlowe.ai +short @1.1.1.1     # → empty
curl -sI https://jlowe.ai/            # → server: Vercel
curl -sI https://jlowe-ai.vercel.app/ # → still 200; this is the origin you just pointed at
```

Bound by the previous CloudFront alias TTL (~60s) plus the new 300s TTL.
IPv6 clients fall back to A once the AAAA is gone.

### 1.3 Stabilize (still no Terraform apply)

```bash
gh variable set CUTOVER_ENABLED -R joshrlowe/jlowe.ai -b false
```

That stops push-to-`main` from shipping web/chat/contact to prod and from
entering the terraform `apply` job. It does **not** by itself move DNS;
step 1.1 already did that.

Do **not** dispatch `terraform.yml` apply. Do **not** "fix" drift by
reverting `dns_delegated` in an emergency — that is an apply, and an apply
would recreate the CloudFront alias over the Vercel A.

Reconcile Terraform later, as a planned change, after traffic is stable on
v1. The live record is already correct (→ Vercel); state is just wrong.

### 1.4 Git fallback (not the live switch)

Live traffic is DNS. Git is how you _read_ or _re-deploy_ v1:

```bash
git fetch origin v1-legacy
git checkout v1-legacy          # tree at v1.0.0
# equivalent pin:
git checkout v1.0.0
```

- `v1-legacy` and tag `v1.0.0` both point at `ef74fe7`.
- `https://jlowe-ai.vercel.app` is the last-good Vercel deployment and is
  the origin the UPSERT points at. **Do not disconnect the Vercel project
  until after burn-in** — it is the rollback target.
- If a new v1 build is ever required, deploy **from `v1-legacy` / `v1.0.0`**,
  not from whatever `main` has become.

### 1.5 Paper rehearsal checklist

Walk this list out loud before anyone merges. Do not actually run the UPSERT
as a drill against production.

- [ ] `ZONE=Z0012698VM2JOIRL7K4K` is in the paste buffer.
- [ ] UPSERT A JSON is valid (name `jlowe.ai.`, type `A`, TTL 300, value
      `76.76.21.21`).
- [ ] AAAA delete path is either `jq` against the live record or the
      verified AliasTarget above.
- [ ] `gh variable set CUTOVER_ENABLED … -b false` is the _next_ command,
      not a Terraform apply.
- [ ] `v1-legacy` / `v1.0.0` / `https://jlowe-ai.vercel.app` are all known
      reachable.
- [ ] www is left alone; it 301s to the (now Vercel) apex.

---

## 2. Collapse sequence (the actual merge `v2` → `main`)

Do not run this section as part of the PR that adds this file. When Josh
decides to collapse, execute in this order.

### 2.0 Freeze the Vercel rollback target **before** any git move

Vercel currently builds `main` (v1). After the collapse, `main` is the v2
tree. v2's `vercel.json` `ignoreCommand` is:

```text
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && exit 1 || exit 0
```

On Vercel, exit 1 means **proceed with the build**. A naive merge would
therefore **overwrite** `https://jlowe-ai.vercel.app` with a v2 static
export and destroy the rollback origin.

Before touching git:

1. In the Vercel project, **pause production deployments** (or set the
   ignored build step to always skip). Do not delete the project.
2. Confirm `https://jlowe-ai.vercel.app` still serves the v1 HTML
   (`server: Vercel`, not S3/CloudFront).
3. Leave the project connected through burn-in. Disconnecting is a
   post-burn-in cleanup step, not part of the merge.

### 2.1 Join histories without a textual merge

`v2` and `main` diverged on purpose. As of this writing: **172** commits
only on `v2`, **76** only on `main`. A default recursive merge would try to
reconcile a Next Pages + Prisma app with a pnpm monorepo + static export.
That is not a merge, it is a rewrite. We want **v2's tree** with **both
histories** in the DAG.

`-s ours` on `v2` records `main` as a parent and keeps the `v2` tree.
Merging that commit into `main` is then a fast-forward:

```bash
# v1-legacy already exists on origin (ef74fe7). Do not recreate it.

git fetch origin
git checkout v2
git merge -s ours origin/main -m "chore: record main history; keep v2 tree"

git checkout main
git merge --ff-only v2
```

Why this works:

| Step                                | Parents                     | Tree   | Effect                                                                       |
| ----------------------------------- | --------------------------- | ------ | ---------------------------------------------------------------------------- |
| `merge -s ours origin/main` on `v2` | `(old v2, main)`            | **v2** | `main`'s unique commits become ancestors; none of their files enter the tree |
| `merge --ff-only v2` on `main`      | fast-forward to that commit | **v2** | `main` now points at the same commit; both histories are reachable           |

**Do not squash. Do not rebase `v2` onto `main`. Do not force-push `main`.**
A GitHub "Squash and merge" of `v2` → `main` would drop the history join
and still risk a textual merge if the ours commit is not already on `v2`.
Push the ours commit to `v2` first, then fast-forward `main` locally (or
open a PR and merge it with **merge commit / rebase disabled / ff-only**).

### 2.2 Verify the tree, then delete leftover v1 workflows if a naive merge leaked them

After a correct `-s ours` then ff, `main`'s tree is v2's. Confirm:

```bash
git ls-tree --name-only main:.github/workflows
# expected (v2):
#   ci.yml
#   deploy-chat.yml
#   deploy-contact.yml
#   deploy-web.yml
#   lighthouse.yml
#   terraform.yml
```

A **naive** recursive merge of `v2` into `main` keeps files that exist only
on `main` and content-merges files that exist on both. That is the trap.

On `origin/main` today:

| File                                                 | Where                                                     | After a naive merge                 |
| ---------------------------------------------------- | --------------------------------------------------------- | ----------------------------------- |
| `test.yml`                                           | main only (v1 "Test Suite": lint/build/e2e/jest/pgvector) | **kept** — must delete              |
| `release.yml`                                        | main only (release-please on push to `main`)              | **kept** — must delete              |
| `stale.yml`                                          | main only (cron stale issues/PRs)                         | **kept** — must delete              |
| `ci.yml`                                             | v2 only                                                   | added                               |
| `lighthouse.yml`                                     | v2 only                                                   | added                               |
| `deploy-contact.yml`                                 | v2 only                                                   | added                               |
| `deploy-web.yml`, `deploy-chat.yml`, `terraform.yml` | **both** (inert copies landed on main in #115 / 3886e48)  | **content-merge**, likely conflicts |

v2's `ci.yml` / `lighthouse.yml` / `terraform.yml` / `deploy-*` take over.
Delete `test.yml`, `release.yml`, and `stale.yml` **after** the merge if
they are present. They must not keep running against a tree they cannot
build (no Prisma, no `npm ci`, no `pages/`).

Follow-up, not a blocker: v2 `ci.yml` and `lighthouse.yml` `push:` only on
`v2`. After collapse, pushes to `main` will not run them until those
workflows add `main` to `push.branches`. PRs targeting `main` already do.

### 2.3 Flip `CUTOVER_ENABLED`

Keep the flag **false** through the git move so the merge commit itself
does not fire prod deploys (and does not enter the terraform apply job
with empty dispatch inputs — see below). After the tree on `main` is
verified:

```bash
gh variable set CUTOVER_ENABLED -R joshrlowe/jlowe.ai -b true
```

Flipping the flag does not deploy by itself. The next `push` to `main`
does, per workflow:

| Workflow                                                           | `on.push`                               | Job `if`                                                                                  | What a push to `main` does when the flag is `true`                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`deploy-web.yml`](../../.github/workflows/deploy-web.yml)         | `branches: [main]`                      | `workflow_dispatch` **or** `vars.CUTOVER_ENABLED == 'true'`                               | `environment: prod`. Builds `@velocity/web` static export, two-tier `s3 sync` to `vars.SITE_BUCKET`, CloudFront `/*` invalidation.                                                                                                                                                                                                                                                                                              |
| [`deploy-chat.yml`](../../.github/workflows/deploy-chat.yml)       | `branches: [main]`                      | same                                                                                      | `environment: prod`. `pnpm corpus` + bundle + `aws lambda update-function-code` on `jlowe-ai-chat-prod`.                                                                                                                                                                                                                                                                                                                        |
| [`deploy-contact.yml`](../../.github/workflows/deploy-contact.yml) | `branches: [main]`                      | same                                                                                      | `environment: prod`. Bundle + `update-function-code` on `jlowe-ai-contact-prod`.                                                                                                                                                                                                                                                                                                                                                |
| [`terraform.yml`](../../.github/workflows/terraform.yml)           | `branches: [main]`, `paths: [infra/**]` | apply job: `workflow_dispatch && action=apply` **or** `push && CUTOVER_ENABLED == 'true'` | **Armed, but not prod-safe as written.** The apply job still reads `inputs.stack` / `inputs.environment` (dispatch-only). On `push` those are empty: `environment` becomes `terraform-`, `STACK=""`, `DIR=infra/terraform/`. Manual `workflow_dispatch` apply remains the working path. Do not treat a push-to-`main` infra change as a prod apply until this job is taught to select `envs`/`prod` (or to skip apply on push). |

`ci.yml` and `lighthouse.yml` are not gated on `CUTOVER_ENABLED`.

After the flip, dispatch the three prod deploys once (still gated by the
`prod` environment reviewer) so prod matches `main` without waiting for
an incidental push:

```bash
gh workflow run deploy-web.yml     --ref main -f environment=prod
gh workflow run deploy-chat.yml    --ref main -f environment=prod
gh workflow run deploy-contact.yml --ref main -f environment=prod
```

### 2.4 Do not disconnect Vercel until burn-in

Soak hours, ideally overnight:

- [ ] `https://jlowe.ai/` is v2 (CloudFront / S3 headers, no `server: Vercel`).
- [ ] `https://www.jlowe.ai/` 301s to the apex.
- [ ] `POST https://jlowe.ai/api/chat` streams; `POST /api/contact` accepts a
      real submission (SES may still be in sandbox).
- [ ] Rollback commands from §1 still work on paper; Vercel still serves
      `https://jlowe-ai.vercel.app`.

Only then: disconnect the Vercel project, drop the v1 cron, noindex the
`*.vercel.app` host if it remains resolvable. Not before.

---

## 3. Inventory — what v1 owns that v2 does not

Decisions already made in the handoff. This table is the working copy for
the digital-twin port (task D) and for what we are willing to lose when
`main`'s tree becomes v2.

| Capability                                                             | v1 (on `origin/main`)                                                                                                                                                                                                                      | v2 today                                                                                                                                                             | Decision                                                                                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Admin CMS** (articles/projects CRUD, NextAuth credentials)           | `pages/admin/**`, `pages/api/admin/**`, `pages/api/auth/[...nextauth].ts`, Prisma `AdminUser` + bcrypt, 1h JWT                                                                                                                             | No `/admin`. Public content is `corpus/**/*.md` → committed `apps/web/src/data/corpus.generated.ts` (`pnpm corpus`)                                                  | **retire** — static corpus is the CMS                                                                                                                                          |
| **Comments + LLM moderation**                                          | `pages/api/comments/**`, `lib/moderation/*`. Model `anthropic.claude-haiku-4-5-20251001-v1:0`. Classifier timeout/error **fail-open to `held`** (never auto-reject on infra failure); public GET only returns `moderationStatus: approved` | No comments                                                                                                                                                          | **retire**                                                                                                                                                                     |
| **Inngest background jobs**                                            | `pages/api/inngest.ts` serves `regenerateEmbeddings` (`lib/jobs/regenerate-embeddings.ts`): fan-out `knowledge/reindex.requested` + per-source Titan upsert on publish/update/delete                                                       | No Inngest. Corpus change → rebuild + Lambda redeploy                                                                                                                | **retire**                                                                                                                                                                     |
| **Contact API**                                                        | `pages/api/contact` is a **GET of CMS contact details** (email, socials) used to render `mailto:` on `pages/contact.tsx`. No visitor form POST. Digest mail goes through Resend                                                            | `services/contact` Lambda + SES v2, CloudFront `/api/contact`, WAF rate-limit (PR #158)                                                                              | **replace** (PR #158 already did)                                                                                                                                              |
| **Nightly qualified-lead digest**                                      | Vercel Cron `0 12 * * *` → `pages/api/cron/qualified-leads-digest.ts`, `Authorization: Bearer ${CRON_SECRET}`, Prisma `ChatSession` where `qualified && !emailedToOwner`, send via Resend                                                  | Not built yet. Replacement is EventBridge → Lambda → SES v2 (no Function URL, no shared secret; EventBridge is the only invoker). `CRON_SECRET` is a Vercel artifact | **replace** with EventBridge + SES v2                                                                                                                                          |
| **Prisma / pgvector RAG store**                                        | `KnowledgeChunk` (`vector(1024)` + `tsvector`), hybrid retrieval in `lib/rag/vector-search.ts` (Titan embed, RRF k=60 top-20, optional Cohere rerank)                                                                                      | `packages/corpus-index` (#160): build-time BM25 + RRF, committed index, CI freshness gate. `modules/knowledge_base` is still a skeleton and must stay unimplemented  | **replace** with the build-time embedded index — **not** OpenSearch, **not** a Bedrock Knowledge Base                                                                          |
| **Chat funnel: sessions, intent, `book_meeting`, citations, Langfuse** | `pages/api/chat.ts` + `lib/chat/intent.ts` + `lib/chat/tools.ts` (`book_meeting` → Cal.com) + Prisma `ChatSession` / `ChatMessageRow` + `lib/observability/langfuse.ts`. Citations from retrieved chunks. v1 fires `void trace.flush()`    | Lambda streams persona-grounded text from a baked `SYSTEM_PROMPT`. No retrieval-on-request, no sessions, no tools, no citations, no Langfuse                         | **port** to Lambda (task D). On Lambda, `await trace.flush()` **before** the handler returns — v1's fire-and-forget flush would be lost when the execution environment freezes |
| **Upstash rate limit**                                                 | `lib/utils/rateLimit.ts` (`@upstash/ratelimit` sliding window). **Fails open** if `UPSTASH_REDIS_REST_URL` / `_TOKEN` are unset                                                                                                            | Edge WAFv2 `rate-limit-api-chat` (1000 / 5 min / IP, BLOCK) and `rate-limit-api-contact`. Per-session limiter in task D is DynamoDB, not Upstash                     | **retire**                                                                                                                                                                     |
| **MongoDB leftover**                                                   | Unused: `MONGODB_URI` / `MONGODB_URL` in `.env.example`, `cleanMongoFields`, `npm run prisma:migrate-data` (Mongo → Postgres one-off). Production data path is Prisma                                                                      | Nothing                                                                                                                                                              | **retire**                                                                                                                                                                     |
| **Design sandbox `/design` and `/admin` UI**                           | `/design/comp` — Liquid Heat preview, `noindex`, no chrome (`pages/_app.tsx` `isDesignPage`). `/admin/*` is the authenticated CMS, also `noindex`                                                                                          | No `/design`, no `/admin`                                                                                                                                            | **retire**                                                                                                                                                                     |

Task D consumes the **port** and **replace** rows; the **retire** rows are
accepted losses of the collapse. Do not re-open them on the merge PR.
