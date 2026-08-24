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

variable "chat_function_url_host" {
  description = "Hostname of the chat Lambda Function URL — the origin for /api/chat*."
  type        = string
}

variable "chat_function_name" {
  description = "Chat Lambda function name (for the CloudFront invoke permission)."
  type        = string
}

variable "contact_function_url_host" {
  description = "Hostname of the contact Lambda Function URL — the origin for /api/contact*."
  type        = string
}

variable "contact_function_name" {
  description = "Contact Lambda function name (for the CloudFront invoke permissions)."
  type        = string
}

variable "mask_origin_403_as_404" {
  description = <<-EOT
    When true (default, prod-safe), a distribution-wide custom error response
    remaps origin 403s to the friendly /404.html page — good for missing S3 keys
    on an OAC'd private bucket, but it also hides the chat Lambda origin's real
    403s (the /api/chat OAC failure looks like an S3 404). Set false on an
    environment you are actively debugging (dev) so the true origin status
    reaches the viewer and the access logs; the tradeoff is that a genuinely
    missing S3 key then surfaces a raw 403 instead of /404.html.
  EOT
  type        = bool
  default     = true
}

variable "waf_web_acl_arn" {
  description = <<-EOT
    ARN of a CLOUDFRONT-scope WAFv2 Web ACL (from modules/waf) to associate with
    this distribution. Optional/toggleable: null leaves the distribution without
    a WAF. Must be a us-east-1 CLOUDFRONT-scope ACL.
  EOT
  type        = string
  default     = null
}

variable "cert_serial" {
  description = <<-EOT
    Serial that keys the ACM certificate resource. Bump it to make terraform
    request a brand-new certificate on the next apply. Needed when a certificate
    is stuck in a TERMINAL state (FAILED / CAA_ERROR), which ACM never
    re-validates and terraform cannot detect on its own -- see the comment above
    aws_acm_certificate.site. Replacement is create-before-destroy, so there is
    no TLS gap. Record the reason for each bump alongside the value in the
    environment's tfvars.
  EOT
  type        = number
  default     = 1
}
