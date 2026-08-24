# The hosted zone is an account singleton owned by the global stack; read it
# here via data source (the spec's "import via data source").
data "aws_route53_zone" "primary" {
  name = "jlowe.ai"
}

module "waf" {
  source = "../modules/waf"

  environment = var.environment
  rate_limit  = var.chat_rate_limit

  # dev observes managed-rule hits in COUNT mode (no false-positive risk while
  # the site is under active development); prod blocks. The /api/chat rate limit
  # always blocks regardless — it's a cost guardrail.
  managed_rules_count_only = var.environment == "dev"
}

module "cdn" {
  source = "../modules/cdn"

  environment    = var.environment
  domain_name    = var.domain_name
  zone_id        = data.aws_route53_zone.primary.zone_id
  dns_delegated  = var.dns_delegated
  robots_noindex = var.robots_noindex

  # dev sets this false to un-mask the chat origin's real 403 while debugging.
  mask_origin_403_as_404 = var.mask_origin_403_as_404

  # /api/chat* origin + the CloudFront→FunctionURL invoke permission live here
  # (cdn depends on chat one-way; chat no longer references cdn → no cycle).
  chat_function_url_host = module.chat.function_url_host
  chat_function_name     = module.chat.function_name

  # Edge WAF association (CLOUDFRONT-scope Web ACL ARN).
  waf_web_acl_arn = module.waf.web_acl_arn

  # Bump in <env>.tfvars to force a fresh ACM certificate.
  cert_serial = var.cert_serial
}

module "chat" {
  source = "../modules/chat"

  environment      = var.environment
  bedrock_model_id = var.bedrock_model_id
  lambda_zip_path  = "${path.module}/../../../services/chat/dist/handler.zip"
}

# Cost guardrails (Stage 2.4) — optional per env, gated by enable_* flags so a
# plan is a no-op until an owner flips them on (and supplies emails) at apply.
module "budgets" {
  count  = var.enable_budgets ? 1 : 0
  source = "../modules/budgets"

  environment       = var.environment
  monthly_limit_usd = var.budget_monthly_limit_usd
  alert_emails      = var.budget_alert_emails
}

module "alarms" {
  count  = var.enable_alarms ? 1 : 0
  source = "../modules/alarms"

  environment                = var.environment
  lambda_function_name       = module.chat.function_name
  cloudfront_distribution_id = module.cdn.distribution_id

  ops_alert_emails = var.ops_alert_emails
  # Reuse the budgets topic when budgets are on, so cost + ops alerts share a
  # channel; the ternary keeps module.budgets[0] out of scope when it's absent.
  extra_alarm_action_arns = var.enable_budgets ? [module.budgets[0].sns_topic_arn] : []

  lambda_error_threshold                 = var.lambda_error_threshold
  lambda_throttle_threshold              = var.lambda_throttle_threshold
  cloudfront_5xx_rate_threshold          = var.cloudfront_5xx_rate_threshold
  lambda_duration_p99_threshold_ms       = var.lambda_duration_p99_threshold_ms
  lambda_concurrent_executions_threshold = var.lambda_concurrent_executions_threshold
}

# Skeleton modules — wired here when implemented in their phases:
# module "knowledge_base" {
#   source      = "../modules/knowledge_base"
#   environment = var.environment
# }
