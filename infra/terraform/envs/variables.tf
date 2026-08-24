variable "environment" {
  description = "dev | prod"
  type        = string
}

variable "domain_name" {
  description = "Public hostname for this environment"
  type        = string
}

variable "dns_delegated" {
  description = "See modules/cdn — flip true only after the Namecheap NS flip"
  type        = bool
  default     = false
}

variable "robots_noindex" {
  description = "Emit X-Robots-Tag: noindex (true for dev)"
  type        = bool
  default     = false
}

variable "bedrock_model_id" {
  description = "Bedrock model id for the chat Lambda (see modules/chat)"
  type        = string
  default     = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}

variable "mask_origin_403_as_404" {
  description = "See modules/cdn — keep true on prod; false on dev to un-mask the /api/chat 403"
  type        = bool
  default     = true
}

# --- Cost guardrails: budgets (modules/budgets) ------------------------------
variable "enable_budgets" {
  description = "Create the monthly cost budget + SNS notifications for this env."
  type        = bool
  default     = false
}

variable "budget_monthly_limit_usd" {
  description = "Monthly USD spend limit the 50/80/100% budget notifications measure against."
  type        = number
  default     = 50
}

variable "budget_alert_emails" {
  description = "Owner emails subscribed to the budget SNS topic (must confirm the AWS email once)."
  type        = list(string)
  default     = []
}

# --- Cost guardrails: alarms (modules/alarms) --------------------------------
variable "enable_alarms" {
  description = "Create CloudWatch alarms for the chat Lambda + CloudFront distribution."
  type        = bool
  default     = false
}

variable "ops_alert_emails" {
  description = "Owner emails for a dedicated ops SNS topic. Empty = alarms reuse the budgets topic only."
  type        = list(string)
  default     = []
}

variable "lambda_error_threshold" {
  description = "Chat Lambda Errors (Sum/period) alarm threshold."
  type        = number
  default     = 5
}

variable "lambda_throttle_threshold" {
  description = "Chat Lambda Throttles (Sum/period) alarm threshold."
  type        = number
  default     = 1
}

variable "cloudfront_5xx_rate_threshold" {
  description = "CloudFront 5xxErrorRate (percent) alarm threshold."
  type        = number
  default     = 5
}

variable "lambda_duration_p99_threshold_ms" {
  description = "Chat Lambda Duration p99 alarm threshold in ms (below the 60s timeout)."
  type        = number
  default     = 30000
}

variable "lambda_concurrent_executions_threshold" {
  description = "Chat Lambda ConcurrentExecutions (Maximum) alarm threshold."
  type        = number
  default     = 50
}

variable "chat_rate_limit" {
  description = "Per-IP WAF rate limit for /api/chat* over 5 minutes (see modules/waf)"
  type        = number
  default     = 1000
}

variable "cert_serial" {
  description = <<-EOT
    Bump to force a fresh ACM certificate request. See
    modules/cdn/variables.tf for the full rationale.
  EOT
  type        = number
  default     = 1
}

variable "contact_rate_limit" {
  description = "Per-IP WAF rate limit for /api/contact* over 5 minutes (see modules/waf)"
  type        = number
  default     = 100
}

# --- Contact form (modules/contact) -----------------------------------------
variable "contact_recipient_email" {
  description = "Inbox that receives contact-form submissions."
  type        = string
  default     = "joshlowe.cs@gmail.com"
}

variable "calcom_username" {
  description = "Cal.com username for the chat book_meeting tool. Empty = tool stays dark."
  type        = string
  default     = ""
}

variable "calcom_event_type_slug" {
  description = "Cal.com event-type slug appended to cal.com/{username}/{slug}."
  type        = string
  default     = "30min"
}

variable "verify_contact_recipient_identity" {
  description = <<-EOT
    Create the SES address identity for contact_recipient_email in this env.
    It is an account+region singleton, so exactly ONE environment may set it —
    prod does; dev inherits the verification. See modules/contact/variables.tf.
  EOT
  type        = bool
  default     = false
}
