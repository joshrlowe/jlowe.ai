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
