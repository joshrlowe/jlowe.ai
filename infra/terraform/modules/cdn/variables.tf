variable "environment" {
  description = "Environment name (dev|prod). Used in resource names."
  type        = string
}

variable "domain_name" {
  description = "Public hostname for this environment (e.g. dev.jlowe.ai)"
  type        = string
}

variable "zone_id" {
  description = "Route53 hosted zone id for jlowe.ai (from the global stack)"
  type        = string
}

variable "dns_delegated" {
  description = <<-EOT
    Gate for everything that needs a resolving jlowe.ai zone. Keep false for the
    first apply (distribution comes up on the CloudFront default cert); flip true
    only AFTER the Namecheap nameserver flip + `dig NS` verification, so ACM DNS
    validation can complete instead of blocking ~75 minutes then failing.
  EOT
  type        = bool
  default     = false
}

variable "robots_noindex" {
  description = "Emit X-Robots-Tag: noindex,nofollow (true for dev)"
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # NA + EU; cheapest, fine for a personal site
}
