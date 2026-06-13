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
