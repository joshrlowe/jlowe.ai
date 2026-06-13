# Infra bootstrap & Phase 0 runbook

Terraform manages all jlowe.ai infrastructure **except** two resources it cannot
own for itself, created once by [`bootstrap.sh`](./bootstrap.sh):

- the **S3 state bucket** (`jlowe-ai-terraform-state-509399626117`) — Terraform
  can't store its own backend's state; and
- the **GitHub OIDC provider** — kept out of TF state so `terraform destroy` of
  any stack can never sever CI's auth.

Everything else is Terraform. Local Terraform is **fmt/validate/plan only**;
applies happen in CI behind reviewer-gated environments — with one documented
exception (step 3 below: the first `global` apply creates the roles CI assumes).

## Stacks

| Stack          | State key                     | Contents                                            |
| -------------- | ----------------------------- | --------------------------------------------------- |
| `global/`      | `global/terraform.tfstate`    | hosted zone + replicated Vercel records, 3 CI roles |
| `envs/` (dev)  | `envs/dev/terraform.tfstate`  | `modules/cdn` for dev.jlowe.ai                      |
| `envs/` (prod) | `envs/prod/terraform.tfstate` | written, not applied in Phase 0                     |

`modules/cdn` is fully implemented; `modules/{chat,knowledge_base,waf,budgets}`
are TODO skeletons.

## Phase 0 runbook (in order)

1. **Land workflows on `main`** (PR7) so `workflow_dispatch` can target `v2`.
2. **Bootstrap** (local, account 509399626117 creds): `bash infra/terraform/bootstrap/bootstrap.sh`. Idempotent.
3. **First `global` apply** (local — documented exception; it creates the CI roles):
   ```bash
   cd infra/terraform/global
   terraform init && terraform plan && terraform apply
   terraform output            # capture name_servers + role ARNs
   ```
4. **GitHub setup** (gh CLI):
   ```bash
   REPO=joshrlowe/jlowe.ai; USER_ID=$(gh api user --jq .id)
   gh api -X PUT "repos/$REPO/environments/dev"
   for e in prod terraform-dev terraform-prod; do
     jq -n --argjson id "$USER_ID" '{reviewers:[{type:"User",id:$id}],prevent_self_review:false}' \
       | gh api -X PUT "repos/$REPO/environments/$e" --input -
   done
   gh variable set AWS_ACCOUNT_ID -R $REPO -b 509399626117
   gh variable set GHA_TERRAFORM_ROLE_ARN      -R $REPO -b "<terraform_role_arn>"
   gh variable set GHA_TERRAFORM_PLAN_ROLE_ARN -R $REPO -b "<terraform_plan_role_arn>"
   gh variable set GHA_DEPLOY_WEB_ROLE_ARN     -R $REPO -b "<deploy_web_role_arn>"
   gh variable set CUTOVER_ENABLED   -R $REPO -b false
   gh variable set INFRA_BOOTSTRAPPED -R $REPO -b true   # enables CI plans
   ```
5. **Prove CI**: `gh workflow run terraform.yml --ref v2 -f stack=global -f action=plan` → expect "No changes".
6. **Dev apply** (`dns_delegated=false`): `gh workflow run terraform.yml --ref v2 -f stack=envs -f environment=dev -f action=apply` (approve the `terraform-dev` gate). Then sync env vars from `terraform output`:
   ```bash
   gh variable set SITE_BUCKET -R $REPO -e dev -b jlowe-ai-site-dev
   gh variable set CLOUDFRONT_DISTRIBUTION_ID -R $REPO -e dev -b "<distribution_id>"
   gh variable set SITE_URL -R $REPO -e dev -b https://dev.jlowe.ai
   ```
7. **Deploy** (dev): `gh workflow run deploy-web.yml --ref v2 -f environment=dev`. Smoke-test `https://<distribution_domain_name>` — renders + `x-robots-tag: noindex`.
8. **NS flip** (manual, Namecheap): set the four `awsdns-*` nameservers (`terraform -chdir=infra/terraform/global output name_servers`). Domain List → jlowe.ai → Nameservers → Custom DNS.
9. **Verify delegation**: `dig NS jlowe.ai +short @1.1.1.1` → awsdns; `dig A jlowe.ai +short` → 76.76.21.21; `curl -sI https://jlowe.ai` → 200 (**live v1 unaffected**).
10. **Delegate cert**: PR flipping `dns_delegated = true` in `envs/dev.tfvars` → CI plan → dispatch apply. ACM validates in minutes; `dev.jlowe.ai` A/AAAA attach.
11. **Acceptance**: `curl -sI https://dev.jlowe.ai/` → HTTP/2 200 with `content-security-policy`, `strict-transport-security`, `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy`, `permissions-policy`, `x-robots-tag: noindex, nofollow`. `/about` → 200 (rewrite fn); `/nope` → 404 via `/404.html`.

Cost: hosted zone $0.50/mo + queries + S3/CloudFront pennies ≈ **$1/month**.
