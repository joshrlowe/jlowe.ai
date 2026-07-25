environment    = "dev"
domain_name    = "dev.jlowe.ai"
dns_delegated  = true # delegated to Route53 — enables dev.jlowe.ai + ACM
robots_noindex = true

# Debug lever: let the chat Lambda origin's real 403 reach the viewer + access
# logs instead of being remapped to the S3 /404.html page. Safe on the
# noindex'd dev host; prod keeps the default (true).
mask_origin_403_as_404 = false

# --- Cost guardrails (Stage 2.4) --------------------------------------------
# Flip enable_* to true and supply real emails at a gated apply; false keeps the
# plan a no-op. Dev thresholds are deliberately loose (low traffic, noisy).
enable_budgets           = false
budget_monthly_limit_usd = 20
# budget_alert_emails    = ["joshlowe.cs@gmail.com"]

enable_alarms = false
# ops_alert_emails = ["joshlowe.cs@gmail.com"]
lambda_error_threshold                 = 10
lambda_throttle_threshold              = 1
cloudfront_5xx_rate_threshold          = 10
lambda_duration_p99_threshold_ms       = 45000
lambda_concurrent_executions_threshold = 20
