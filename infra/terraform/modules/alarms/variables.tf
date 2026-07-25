variable "environment" {
  description = "Environment name (dev|prod). Used in alarm names."
  type        = string
}

variable "lambda_function_name" {
  description = "Chat Lambda function name (FunctionName dimension for Lambda metrics)."
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution id (DistributionId dimension for the 5xx alarm)."
  type        = string
}

# --- Notification wiring -----------------------------------------------------
variable "ops_alert_emails" {
  description = "Owner emails for a dedicated ops SNS topic. When empty, no topic is created and alarms rely on extra_alarm_action_arns."
  type        = list(string)
  default     = []
}

variable "extra_alarm_action_arns" {
  description = "Additional SNS topic ARNs to notify (e.g. the budgets module topic to share one channel)."
  type        = list(string)
  default     = []
}

# --- Evaluation windows ------------------------------------------------------
variable "period" {
  description = "Metric period in seconds for the Lambda alarms."
  type        = number
  default     = 300
}

variable "cloudfront_period" {
  description = "Metric period in seconds for the CloudFront 5xx alarm."
  type        = number
  default     = 300
}

variable "evaluation_periods" {
  description = "Number of periods a metric must breach before the alarm fires."
  type        = number
  default     = 1
}

# --- Thresholds (env-parameterized: dev looser, prod tighter) ----------------
variable "lambda_error_threshold" {
  description = "Fire when Lambda Errors (Sum) over the period is >= this."
  type        = number
  default     = 5
}

variable "lambda_throttle_threshold" {
  description = "Fire when Lambda Throttles (Sum) over the period is >= this."
  type        = number
  default     = 1
}

variable "cloudfront_5xx_rate_threshold" {
  description = "Fire when CloudFront 5xxErrorRate (percent, Average) exceeds this."
  type        = number
  default     = 5
}

variable "enable_duration_alarm" {
  description = "Create the Lambda p99 Duration alarm."
  type        = bool
  default     = true
}

variable "lambda_duration_p99_threshold_ms" {
  description = "Fire when Lambda Duration p99 exceeds this (ms). Below the 60s function timeout."
  type        = number
  default     = 30000
}

variable "enable_concurrency_alarm" {
  description = "Create the Lambda ConcurrentExecutions alarm."
  type        = bool
  default     = true
}

variable "lambda_concurrent_executions_threshold" {
  description = "Fire when Lambda ConcurrentExecutions (Maximum) exceeds this."
  type        = number
  default     = 50
}
