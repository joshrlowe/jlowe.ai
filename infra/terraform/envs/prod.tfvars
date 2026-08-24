# Prod environment tfvars. The cost + security guardrails below are ENABLED
# ahead of the production cutover, but only take effect at the gated prod
# terraform apply in CI — local terraform is fmt/validate/plan only, never
# apply. The apex stays on Vercel until the cutover phase.
environment    = "prod"
domain_name    = "jlowe.ai"
dns_delegated  = true
robots_noindex = false

# --- Cost guardrails (Stage 2.4) — ENABLED for cutover ----------------------
# Budgets: a monthly COST budget ($50) with 50/80/100% notifications fanned out
# through an SNS topic. The owner email must confirm the AWS SNS subscription
# once after the first apply.
enable_budgets           = true
budget_monthly_limit_usd = 50
budget_alert_emails      = ["joshlowe.cs@gmail.com"]

# Alarms: CloudWatch alarms on the chat Lambda + CloudFront, published to a
# dedicated ops SNS topic (owner email) and shared with the budgets topic.
enable_alarms    = true
ops_alert_emails = ["joshlowe.cs@gmail.com"]

# Alarm thresholds — prod is tighter than dev (cloudfront_5xx = 3 vs 10);
# the rest match the modules/alarms defaults.
lambda_error_threshold                 = 5
lambda_throttle_threshold              = 1
cloudfront_5xx_rate_threshold          = 3
lambda_duration_p99_threshold_ms       = 30000
lambda_concurrent_executions_threshold = 50

# --- Edge WAF (modules/waf) — BLOCK mode on prod ----------------------------
# The Web ACL is always created and associated with CloudFront (see
# envs/main.tf: module "waf" has no enable flag, and module.cdn receives
# waf_web_acl_arn = module.waf.web_acl_arn). BLOCK mode is NOT a tfvars toggle:
# managed_rules_count_only = (environment == "dev") in main.tf, so
# environment = "prod" above makes it false → the AWS managed rule groups (IP
# reputation, common, known-bad-inputs) run with their native BLOCK actions.
# The /api/chat per-IP rate-limit rule always BLOCKs in every env (cost
# guardrail; chat_rate_limit default = 1000 req / 5 min / IP).

# --- ACM certificate serial -------------------------------------------------
# 1 -> 2 on 2026-08-24. The apply that first added the `www.jlowe.ai` SAN failed
# with CAA_ERROR: www still resolved to cname.vercel-dns.com, and CAA resolution
# follows CNAMEs, so ACM read Vercel's CAA set (globalsign, sectigo,
# letsencrypt, pki.goog -- no amazon.com) and failed the SAN. That left cert
# f8da7245 permanently FAILED while terraform still held it as the current
# object with a stale PENDING_VALIDATION status, so a plain re-apply would
# re-wait on a certificate that can never issue. The legacy CNAME is now gone
# (#157) and CAA is unrestricted; this bump requests a clean replacement.
cert_serial = 2
