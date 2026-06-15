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
