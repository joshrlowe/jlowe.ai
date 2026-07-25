variable "environment" {
  description = "Environment name (dev|prod). Used in resource names."
  type        = string
}

variable "monthly_limit_usd" {
  description = "Monthly account spend limit in USD that 50/80/100% notifications are measured against."
  type        = number

  validation {
    condition     = var.monthly_limit_usd > 0
    error_message = "monthly_limit_usd must be greater than 0."
  }
}

variable "alert_emails" {
  description = "Owner email addresses subscribed to the budget SNS topic. Each must confirm the AWS subscription email once."
  type        = list(string)
  default     = []
}
