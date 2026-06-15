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

variable "cloudfront_distribution_arn" {
  description = <<-EOT
    ARN of the CloudFront distribution allowed to invoke the Function URL. Left
    null on the first apply (the CDN module isn't wired to chat yet) to avoid an
    apply-ordering cycle; when null the lambda_permission is skipped. The
    follow-up PR that adds the /api/chat* behavior passes this.
  EOT
  type        = string
  default     = null
}
