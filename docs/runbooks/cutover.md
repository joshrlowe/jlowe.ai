# Stage 4 — Production cutover runbook

Move `jlowe.ai` (apex) from the **v1 Vercel** deployment to the **v2 CloudFront**
stack, activate push-to-`main` deploys, and retire the v1 pipeline — **without a
window where the apex is unresolvable**, and with a tested one-move rollback.

> Prerequisite: Phase 0 is complete (see
> [`infra/terraform/bootstrap/README.md`](../../infra/terraform/bootstrap/README.md)).
> The `jlowe.ai` hosted zone is live in Route53, NS delegation is already
> flipped at the registrar, `dev.jlowe.ai` serves from CloudFront (noindex), and
> the `global` stack owns the zone + the Vercel replica records + the CI roles.

This runbook is **the doc**, not the switch. The `cutover.md` file itself changes
no Terraform behavior. The prerequisite **code** changes it depends on are called
out inline and tracked under [Open questions](#open-questions). Two conservative
ones have now landed on `chore/cutover-prep` — `allow_overwrite` on the apex alias
(open question #1) and the `envs-prod` CI plan row (open question #5) — both
**inert until a prod apply**, so they change nothing live now. The genuinely
stateful/dangerous steps (removing `apex_vercel` from the `global` config plus the
`state rm`, and the `www` change) remain **deferred** and must land + be reviewed
separately before step 4.2b/4.3.

## Current wiring (verified against the code on `v2`)

| Record                    | Owner (stack · resource)                                      | Value                  | TTL   |
| ------------------------- | ------------------------------------------------------------- | ---------------------- | ----- |
| `jlowe.ai` **A**          | `global` · `aws_route53_record.apex_vercel` (`global/dns.tf`) | `76.76.21.21` (Vercel) | 300   |
| `www.jlowe.ai` **CNAME**  | `global` · `aws_route53_record.www_vercel` (`global/dns.tf`)  | `cname.vercel-dns.com` | 300   |
| `dev.jlowe.ai` **A/AAAA** | `envs` (dev) · `module.cdn.aws_route53_record.alias`          | CloudFront alias       | alias |

The prod env stack (`envs/`, workspace `prod`, state key `envs/prod/terraform.tfstate`)
is **written but never applied**. When applied with `dns_delegated = true`, its
`module.cdn` creates, in `modules/cdn/main.tf`:

- `aws_acm_certificate.site` — `domain_name = var.domain_name` = `jlowe.ai`,
  **no `subject_alternative_names`** (so **no `www` on the cert**);
- `aws_cloudfront_distribution.site.aliases = [var.domain_name]` = `["jlowe.ai"]`
  (**apex only**);
- `aws_route53_record.alias` for each of `["A","AAAA"]`, `name = jlowe.ai`,
  pointing at the CloudFront distribution, now carrying **`allow_overwrite = true`**
  (set at the `for_each` level on `chore/cutover-prep`) so `alias["A"]` can UPSERT
  over the existing Vercel apex A instead of erroring on CREATE — see step 4.2b.

**The collision:** `jlowe.ai` / type `A` is a single Route53 record set. The
`global` stack already owns it (→ Vercel); the prod stack's `alias["A"]` wants to
own it (→ CloudFront). Resolving that two-stack conflict **is** the cutover
switch (step 4.2). The AAAA does **not** collide — `global` declares no apex
AAAA, so the CloudFront `alias["AAAA"]` is brand-new.

---

## Stage 4.1 — Pre-flight checklist

Do not proceed until every box is checked. Anything unchecked that you choose to
skip should be recorded on the cutover PR as an accepted risk.

### GitHub environments & variables (prod)

The `prod` and `terraform-prod` environments exist but their variables are empty
(Phase 0 only populated `dev` / `terraform-dev`). Mirror the dev setup:

- [ ] `prod` and `terraform-prod` environments have the **required reviewer**
      gate configured (same as `terraform-dev`).
- [ ] Repo-level vars present from bootstrap: `AWS_ACCOUNT_ID`,
      `GHA_TERRAFORM_ROLE_ARN`, `GHA_TERRAFORM_PLAN_ROLE_ARN`,
      `GHA_DEPLOY_WEB_ROLE_ARN`, and **`GHA_DEPLOY_CHAT_ROLE_ARN`**
      (bootstrap README step 4 omits the chat role — `deploy-chat.yml` reads
      `vars.GHA_DEPLOY_CHAT_ROLE_ARN`; the ARN is `terraform -chdir=infra/terraform/global output deploy_chat_role_arn`).
- [ ] `INFRA_BOOTSTRAPPED == 'true'`, `CUTOVER_ENABLED == 'false'` (still false).
- [ ] `prod`-scoped env vars will be set **after** the first apply (step 4.2):
      `SITE_BUCKET=jlowe-ai-site-prod`, `CLOUDFRONT_DISTRIBUTION_ID=<id>`,
      `SITE_URL=https://jlowe.ai`. (`deploy-web`/`deploy-chat` on a push resolve the
      environment to `prod` and read these.)

### Terraform / infra review

- [ ] `envs/prod.tfvars` reviewed: `environment=prod`, `domain_name=jlowe.ai`,
      `dns_delegated=false` (correct for the **first** apply), `robots_noindex=false`
      (prod is indexable), and `mask_origin_403_as_404` unset → default `true`
      (prod serves the friendly `/404.html` on origin 403).
- [ ] A `plan` for `envs/prod` has been run and read end-to-end
      (`gh workflow run terraform.yml --ref v2 -f stack=envs -f environment=prod -f action=plan`).

  > The `terraform.yml` **plan** matrix now includes an `envs-prod` row
  > (`-backend-config=backend.prod.hcl -var-file=prod.tfvars`, added on
  > `chore/cutover-prep`; `backend.prod.hcl` already exists under
  > `infra/terraform/envs/`), so infra PRs surface a prod plan. You can also plan
  > prod locally
  > (`terraform -chdir=infra/terraform/envs init -reconfigure -backend-config=backend.prod.hcl && terraform … plan -var-file=prod.tfvars`).

### Dev fully verified (the dress rehearsal)

- [ ] `dev.jlowe.ai` acceptance from the bootstrap runbook passes: HTTP/2 200,
      all six security headers present, `x-robots-tag: noindex, nofollow`, `/about`
      rewrites, `/nope` → 404 via `/404.html`.
- [ ] **Chat works on dev end-to-end**: `POST https://dev.jlowe.ai/api/chat`
      streams tokens (SSE), no 403. (Dev runs with `mask_origin_403_as_404=false`,
      so any OAC/Function-URL signing failure surfaces as a real 403 in the viewer
      and access logs rather than a masked S3 404.)

### Guardrails — BLOCKER, see open questions

- [ ] WAF applied to the prod distribution.
- [ ] Budget + billing alarm active.
- [ ] CloudWatch alarms on the chat Lambda (errors / throttles / p99).

> **As-coded these cannot be checked.** `modules/waf` and `modules/budgets` are
> TODO skeletons (comments only) and are **commented out** in `envs/main.tf`;
> there are no Lambda alarms. Either implement + wire them before prod cutover,
> or explicitly accept launching prod without edge protection and cost
> guardrails. See [Open questions](#open-questions).

---

## Stage 4.2 — First prod apply, then resolve the apex collision

### 4.2a — First prod apply (`dns_delegated = false`)

Brings up the full prod stack on the **CloudFront default certificate** with **no
aliases and no Route53 changes** — so it touches neither the live Vercel apex nor
`www`. It creates the S3 site/log buckets, the distribution, and the chat Lambda
(shipping the committed placeholder zip).

```bash
gh workflow run terraform.yml --ref v2 \
  -f stack=envs -f environment=prod -f action=apply
# → approve the terraform-prod reviewer gate
```

Then capture outputs and set the prod env vars:

```bash
terraform -chdir=infra/terraform/envs init -reconfigure -backend-config=backend.prod.hcl
terraform -chdir=infra/terraform/envs output   # distribution_id, distribution_domain_name, site_bucket_name, chat_function_name

REPO=joshrlowe/jlowe.ai
gh variable set SITE_BUCKET                -R $REPO -e prod -b jlowe-ai-site-prod
gh variable set CLOUDFRONT_DISTRIBUTION_ID -R $REPO -e prod -b "<distribution_id>"
gh variable set SITE_URL                   -R $REPO -e prod -b https://jlowe.ai
```

Deploy real content + chat code to prod (manual dispatch works while
`CUTOVER_ENABLED` is still `false`):

```bash
gh workflow run deploy-web.yml  --ref v2 -f environment=prod   # approve prod gate
gh workflow run deploy-chat.yml --ref v2 -f environment=prod   # approve prod gate
```

**Smoke-test on the distribution domain** (`https://<distribution_domain_name>`,
not `jlowe.ai` yet — the apex still serves v1 Vercel):

- [ ] Home + a rewritten route (`/about`) render; `/nope` → `/404.html`.
- [ ] Security headers present; **no** `x-robots-tag` (prod is indexable).
- [ ] `POST /api/chat` streams (chat Lambda + OAC wired on prod).

The public apex is still 100% v1 at this point. Nothing user-visible has changed.

### 4.2b — Resolve the apex collision (the actual switch)

Goal: move `jlowe.ai` A from `76.76.21.21` (Vercel, owned by `global`) to the
CloudFront alias (owned by `prod`) **atomically**, so no resolver ever sees the
apex missing.

**Why the obvious order is wrong.** If you first remove `apex_vercel` from
`global` and apply, that **deletes** `jlowe.ai` A; the apex is unresolvable until
the later prod apply recreates it — a multi-minute outage. Rejected.

**Why the naive prod apply also fails.** `aws_route53_record.alias` has **no
`allow_overwrite`**, so `alias["A"]` issues a Route53 `CREATE` for a name/type
that already exists → the API returns _"Tried to create resource record set
[name='jlowe.ai.', type='A'] but it already exists"_ and the apply errors out.

**The zero-downtime path** relies on a Route53 `UPSERT` (atomic replace of the
record set's value in one change — resolvers only ever see old-then-new, never
nothing). Prerequisites (must be merged + reviewed before this step):

1. **Done on `chore/cutover-prep`.** `allow_overwrite = true` is now set on
   `aws_route53_record.alias` in `modules/cdn/main.tf` (at the `for_each` level, so
   both `A` and `AAAA` get it) so `alias["A"]` **UPSERTs** over the existing Vercel
   A record instead of failing on `CREATE`. Inert until this prod apply with
   `dns_delegated = true`.
2. **Still required — deliberately NOT on `chore/cutover-prep`.** Delete
   `aws_route53_record.apex_vercel` from `global/dns.tf` (leave `www_vercel` for
   now — see the www decision below). This is deferred on purpose: removing it from
   config arms a live-apex **DELETE** on the next `global` apply, so it must be
   paired with the `state rm` in step 2 below. **Do not apply `global` yet.**

Then execute, in this order:

1. **Flip the flag.** In `envs/prod.tfvars` set `dns_delegated = true`. Dispatch
   the prod apply:

   ```bash
   gh workflow run terraform.yml --ref v2 \
     -f stack=envs -f environment=prod -f action=apply   # approve terraform-prod
   ```

   This one apply: requests `aws_acm_certificate.site`, writes the DNS-validation
   records into the (already-delegated) zone, waits for
   `aws_acm_certificate_validation.site` (minutes, since the zone is
   authoritative), attaches `aliases=["jlowe.ai"]` + the ACM cert to the
   distribution, **UPSERTs `jlowe.ai` A** from Vercel → the CloudFront alias
   (atomic, no gap), and **creates `jlowe.ai` AAAA** (new). The apex now serves
   v2 over IPv4 and IPv6.

2. **Reconcile `global` ownership WITHOUT deleting the live record.** The live
   apex A now points at CloudFront, but the `global` state still records it as
   the Vercel A resource — drift. Do **not** run a `global` apply while
   `apex_vercel` is only removed-from-config-but-still-in-state: Terraform would
   plan a **DELETE** of the live (now-CloudFront) apex → outage. Instead forget
   it from `global` state first:

   ```bash
   terraform -chdir=infra/terraform/global init -reconfigure
   terraform -chdir=infra/terraform/global state rm aws_route53_record.apex_vercel
   terraform -chdir=infra/terraform/global plan    # expect: no changes to the apex A
   ```

   > `state rm` is state surgery, not `plan`/`apply` — the `terraform.yml`
   > workflow has no path for it (plan/apply only). This is therefore a
   > **documented MANUAL step**: run it locally with the terraform role (a
   > documented one-time exception, like the Phase-0 first `global` apply), or
   > add a `state rm` capability to the workflow. See
   > [Open questions](#open-questions).
   >
   > **`www_vercel` is _not_ a `state rm` case.** Only `apex_vercel` is a
   > same-record cross-stack handoff (the one `jlowe.ai` A record set changes
   > owner from `global` → `prod`) that must be forgotten from `global` state so
   > the two stacks stop fighting over it. `www_vercel` is either left untouched
   > (www stays on Vercel — the split-brain default) or, if www moves to a
   > redirect, genuinely **deleted** from `global` via config-removal + a normal
   > `global` apply (a CNAME→A **type change**, not an in-place takeover). Only
   > `state rm` `www_vercel` if you are handing the _same_ `www` record type to
   > `prod`, which the recommended redirect design does not do. See the www
   > decision below.

3. **Verify propagation** (apex A alias answers with a short TTL; resolvers cached
   the old `76.76.21.21` for up to its 300s TTL):

   ```bash
   dig A    jlowe.ai +short @1.1.1.1     # → CloudFront edge IPs (not 76.76.21.21)
   dig AAAA jlowe.ai +short @1.1.1.1     # → CloudFront IPv6
   curl -sI https://jlowe.ai/            # HTTP/2 200, v2 headers, no x-robots-tag
   curl -sI https://jlowe.ai/api/chat -X POST   # not 403
   ```

Keep the rollback move ([Stage 4.4](#stage-44--rollback)) in the other terminal
throughout.

### The `www` decision

As-coded, **`www.jlowe.ai` stays on Vercel** after cutover: the ACM cert has no
`www` SAN, the distribution has no `www` alias, and `global`'s
`aws_route53_record.www_vercel` CNAME → `cname.vercel-dns.com` is untouched. That
leaves an inconsistent split (apex = v2 CloudFront, `www` = v1 Vercel) and
`www` breaks once v1 is retired.

**Recommendation: make `www` a 301 redirect to the apex** (apex is canonical),
which needs three coordinated changes (a separate reviewed PR, not this doc):

1. Cert: `subject_alternative_names = ["www.jlowe.ai"]` on
   `aws_acm_certificate.site` (so TLS for `www` validates). Because the cert
   uses `create_before_destroy`, adding a SAN replaces it cleanly.
2. Redirect mechanism: either a `viewer-request` CloudFront Function that 301s
   `Host: www.jlowe.ai` → `https://jlowe.ai$uri` on a `www`-aliased distribution,
   **or** a tiny S3 website-redirect bucket fronted by its own distribution.
   Add `www.jlowe.ai` to that distribution's `aliases`.
3. DNS: remove `global`'s `www_vercel` **CNAME** and create a `www` **A/AAAA
   alias** to the redirect target. Note this is a **type change** (CNAME → A):
   `allow_overwrite` UPSERT is keyed on name **and** type, so it will **not**
   replace the CNAME in place — `global` must delete the CNAME and `prod` creates
   the A/AAAA. Give `www` a short window / low TTL; it is not the primary host,
   so a brief `www` blip is acceptable (the apex swap stays atomic).

Document the choice actually made on the cutover PR. Doing nothing (leaving `www`
on Vercel) is the **not-recommended** default and must be an explicit accepted
risk if chosen.

---

## Stage 4.3 — Flip `CUTOVER_ENABLED=true` and merge `v2 → main`

Once the apex is stable on v2 (soak it — hours, ideally overnight), activate the
push-to-`main` pipeline.

```bash
gh variable set CUTOVER_ENABLED -R joshrlowe/jlowe.ai -b true
```

Then open + merge the `v2 → main` PR.

**What flipping the flag + the merge activates** (from the `push: branches:[main]`
triggers, all gated on `vars.CUTOVER_ENABLED == 'true'`):

- `deploy-web.yml` — push to `main` builds the static export and deploys to the
  **prod** S3 bucket + invalidates CloudFront (`if:` passes now).
- `deploy-chat.yml` — push to `main` ships the chat Lambda code to
  `jlowe-ai-chat-prod`.
- `terraform.yml` `apply` — push to `main` touching `infra/**` runs a **prod
  apply** (still behind the `terraform-prod`/`terraform-dev` reviewer gate). Note
  this auto-selects the environment; review carefully.
- `ci.yml` and `lighthouse.yml` already run on `main` PRs/pushes — unchanged.

**What to delete** (v1 retirement — a follow-up PR once `main` is green on v2):

- The v1-era GitHub workflows that ship the old Vercel/Next-Pages build from
  `main`. (These live on `main`, not on `v2`, so they are not visible in this
  branch — enumerate them on the merge/cleanup PR. See
  [Open questions](#open-questions).)

**Vercel keeps building `main`, harmlessly.** `vercel.json`'s `ignoreCommand`
(`[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && exit 1 || exit 0`) builds **only**
`main` (exit 1 = proceed). After cutover the apex no longer points at Vercel, so
those builds are dead weight but serve no traffic — and they are exactly the
**rollback target** (see below), so **do not disconnect the Vercel project until
after the burn-in**. Confirm the last `main` build is green before merging.

---

## Stage 4.4 — Rollback

Tested-on-paper. The apex is a single Route53 record set, so rollback is a single
Route53 change — DNS-level, independent of Terraform, and independent of whether
the v2 apply half-finished.

**Fastest move (emergency, do this first):** UPSERT `jlowe.ai` A straight back to
Vercel with a short TTL, via the Route53 console or CLI (a documented emergency
exception to the "Terraform-only" rule — speed beats purity here):

```bash
ZONE=$(terraform -chdir=infra/terraform/global output -raw hosted_zone_id)
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE" --change-batch '{
  "Changes":[{"Action":"UPSERT","ResourceRecordSet":{
    "Name":"jlowe.ai","Type":"A","TTL":300,
    "ResourceRecords":[{"Value":"76.76.21.21"}]}}]}'
# also delete the CloudFront AAAA so IPv6 clients fall back to v1 (which is A-only):
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE" --change-batch '{
  "Changes":[{"Action":"DELETE","ResourceRecordSet":{ ...the alias AAAA... }}]}'
```

The apex resolves back to `76.76.21.21`; the **last-good v1 Vercel deployment**
(still live, still built from `main`) serves traffic again. Bounded by the old
alias answer's cache (~60s) plus the new 300s TTL.

**Then stabilize:**

1. `gh variable set CUTOVER_ENABLED -R joshrlowe/jlowe.ai -b false` — stop
   push-to-`main` from re-applying/redeploying prod.
2. Revert the `dns_delegated = true` change in `envs/prod.tfvars` (back to
   `false`) so the next prod apply doesn't recreate the CloudFront alias A over
   your manual rollback. (The distribution can stay up on the default cert; only
   the alias records matter for traffic.)
3. Restore `global`'s ownership of the apex if you `state rm`'d it: re-add
   `apex_vercel` to `global/dns.tf` and `terraform import` it, or just leave the
   manual UPSERT in place and reconcile later. The live record is already correct
   (→ Vercel); this only re-establishes Terraform management.

**Pre-cutover prep that speeds rollback:** the CloudFront alias A/AAAA answer with
a short TTL already, but the _old_ Vercel A carries TTL 300. Consider lowering the
apex A TTL to 60 for the 24h before cutover so both directions propagate in ~1
min.

---

## Stage 4.5 — Post-cutover

### HSTS preload (after burn-in)

`modules/cdn` ships `strict_transport_security` with `max-age=63072000` (2y),
`include_subdomains=true`, `preload=false` (see the comment in
`modules/cdn/main.tf`: _"flip + submit to hstspreload.org at prod cutover"_).
After a **burn-in of at least the max-age you're comfortable committing to** (days
of stable HTTPS on apex **and** any subdomain, since `includeSubDomains` is on):

1. Set `preload = true` on the response-headers policy; apply prod.
2. Submit `jlowe.ai` at <https://hstspreload.org>.

> Preload is effectively irreversible (browser-baked). Only submit once **every**
> `*.jlowe.ai` host you intend to keep is HTTPS-only — `dev.jlowe.ai` included.

### Verification checklist

- [ ] Headers on `https://jlowe.ai/`: `content-security-policy`,
      `strict-transport-security`, `x-content-type-options: nosniff`,
      `x-frame-options: DENY`, `referrer-policy`, `permissions-policy`.
- [ ] **No** `x-robots-tag` on prod (indexable); dev still `noindex, nofollow`.
- [ ] SEO: `https://jlowe.ai/robots.txt` and `/sitemap.xml` resolve and reference
      the apex (not the CloudFront domain, not dev); request indexing in Search
      Console; confirm canonical host (apex vs `www` per the decision above).
- [ ] Chat: `POST https://jlowe.ai/api/chat` streams; no 403; `prod` Lambda logs
      clean.
- [ ] `www.jlowe.ai` behaves per the documented decision (301 → apex, or the
      accepted-risk split).
- [ ] `/nope` → `/404.html`; `/about` (and other extensionless routes) rewrite
      via the CloudFront Function.

### Monitoring

- [ ] CloudFront access logs (standard logging v2 → `jlowe-ai-cdn-logs-prod`)
      landing; spot-check `sc-status` / `x-edge-result-type`.
- [ ] Chat Lambda CloudWatch alarms (errors/throttles/duration) — **blocked on
      the guardrails work above**.
- [ ] Budget + billing alarm firing test — **blocked on `modules/budgets`**.
- [ ] WAF metrics — **blocked on `modules/waf`**.

---

## Open questions

Flagged rather than guessed. Resolve before executing the affected step.

1. **RESOLVED on `chore/cutover-prep`.** `allow_overwrite = true` is now set on
   `aws_route53_record.alias` (`modules/cdn/main.tf`), so the prod apply with
   `dns_delegated=true` UPSERTs the already-existing `jlowe.ai` A instead of
   failing on `CREATE` — enabling step 4.2b's zero-downtime path. It also affects
   the dev alias record, which is harmless (dev's `dev.jlowe.ai` records are
   already prod-owned singletons). The change is inert until a prod apply with
   `dns_delegated = true`.
2. **Cross-stack apex handoff needs `terraform state rm` on `global`**, which the
   `terraform.yml` workflow does not support (plan/apply only). Decide: run it
   locally as a documented one-time exception (like the Phase-0 first `global`
   apply), or extend the workflow. Getting the order wrong (config-remove +
   apply before `state rm`) deletes the live apex.
3. **Guardrails don't exist yet.** `modules/waf` and `modules/budgets` are
   comment-only skeletons and are commented out in `envs/main.tf`; there are no
   chat-Lambda CloudWatch alarms. The pre-flight requires all three. Decide:
   implement + wire before prod cutover, or launch prod with an explicit
   accepted risk (no edge WAF, no cost alarm).
4. **`www` handling.** As-coded `www` stays on Vercel (no SAN, no alias, CNAME
   untouched). Recommendation is a 301 `www → apex`; pick and record the choice,
   noting the CNAME→A **type change** can't be a clean UPSERT.
5. **RESOLVED on `chore/cutover-prep`.** `terraform.yml`'s `plan` matrix now has an
   `envs-prod` row (`-backend-config=backend.prod.hcl -var-file=prod.tfvars`)
   alongside `global` and `envs-dev`, so infra PRs now exercise a prod plan.
   `backend.prod.hcl` already exists under `infra/terraform/envs/`. Note the plan
   job as a whole still only runs once repo var `INFRA_BOOTSTRAPPED == 'true'`, so
   the prod plan first appears on infra PRs after bootstrap.
6. **`GHA_DEPLOY_CHAT_ROLE_ARN`** is consumed by `deploy-chat.yml` but not set by
   the Phase-0 bootstrap README's `gh variable set` block. Confirm it's set
   (repo-level) before dispatching a prod chat deploy; the ARN is the `global`
   output `deploy_chat_role_arn`.
7. **v1 workflows to delete live on `main`, not `v2`** — they can't be enumerated
   from this branch. List and remove them on the post-merge cleanup PR; keep the
   Vercel project connected until after burn-in (it's the rollback target).
