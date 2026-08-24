variable "environment" {
  description = "Environment name (dev|prod). Used in resource + metric names."
  type        = string
}

variable "rate_limit" {
  description = <<-EOT
    Max requests to /api/chat* per originating IP over a rolling 5-minute window
    before that IP is blocked. WAFv2 requires >= 100. 1000 is generous for a
    human but far below what a scripted loop against the pay-per-token Bedrock
    chat endpoint would generate.
  EOT
  type        = number
  default     = 1000

  validation {
    condition     = var.rate_limit >= 100
    error_message = "WAFv2 rate-based statements require a limit of at least 100."
  }
}

variable "contact_rate_limit" {
  description = <<-EOT
    Max requests to /api/contact* per originating IP over a rolling 5-minute
    window before that IP is blocked. WAFv2's floor is 100, which is already ~2
    orders of magnitude above a human filling in a contact form, so the floor is
    the default — it stops an SES-cost / inbox-flood loop without ever tripping
    on real use.
  EOT
  type        = number
  default     = 100

  validation {
    condition     = var.contact_rate_limit >= 100
    error_message = "WAFv2 rate-based statements require a limit of at least 100."
  }
}

variable "managed_rules_count_only" {
  description = <<-EOT
    Run the AWS managed rule groups (IP reputation, common, known-bad-inputs) in
    COUNT mode instead of their native BLOCK actions. Intended true for dev
    (observe would-be blocks without false positives) and false for prod. Does
    NOT affect the /api/chat rate-based rule, which always blocks.
  EOT
  type        = bool
  default     = false
}
