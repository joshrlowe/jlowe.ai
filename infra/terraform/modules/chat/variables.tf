variable "environment" {
  description = "Environment name (dev|prod). Used in resource names."
  type        = string
}

variable "bedrock_model_id" {
  description = <<-EOT
    Bedrock model id the chat Lambda invokes. Defaults to the US Claude Haiku 4.5
    inference profile; the IAM policy is scoped to this profile plus the
    foundation-model ARNs it routes to (us-east-1/us-east-2/us-west-2).
  EOT
  type        = string
  default     = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}

variable "lambda_zip_path" {
  description = "Path to the bundled handler zip (services/chat/dist/handler.zip)."
  type        = string
}

variable "calcom_username" {
  description = <<-EOT
    Cal.com username used to build booking URLs. Empty (the default) means the
    book_meeting tool is never exposed — the handler fails closed rather than
    inventing a URL.
  EOT
  type        = string
  default     = ""
}

variable "calcom_event_type_slug" {
  description = "Cal.com event-type slug (v1 default: 30min)."
  type        = string
  default     = "30min"
}
