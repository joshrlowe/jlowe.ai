# Written for completeness — NOT applied in Phase 0 (apex stays on Vercel
# until the cutover phase).
environment    = "prod"
domain_name    = "jlowe.ai"
dns_delegated  = false
robots_noindex = false

# --- Cost guardrails (Stage 2.4) --------------------------------------------
# Flip enable_* to true and supply real emails at a gated apply; false keeps the
# plan a no-op. Prod thresholds are tighter than dev — spend + user-facing errors
# matter more on the apex.
enable_budgets           = false
budget_monthly_limit_usd = 75
# budget_alert_emails    = ["joshlowe.cs@gmail.com"]

enable_alarms = false
# ops_alert_emails = ["joshlowe.cs@gmail.com"]
lambda_error_threshold                 = 5
lambda_throttle_threshold              = 1
cloudfront_5xx_rate_threshold          = 3
lambda_duration_p99_threshold_ms       = 30000
lambda_concurrent_executions_threshold = 50
