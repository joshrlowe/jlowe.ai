variable "environment" {
  description = "Environment name (dev|prod). Used in resource names."
  type        = string
}

variable "domain_name" {
  description = <<-EOT
    Hostname this environment sends from (dev.jlowe.ai | jlowe.ai). It becomes
    the SES *domain* identity, which is why dev and prod never collide on the
    account-wide SES identity namespace the way a shared address identity would.
  EOT
  type        = string
}

variable "zone_id" {
  description = "Route53 hosted zone id for jlowe.ai (from the global stack) — holds the Easy DKIM CNAMEs."
  type        = string
}

variable "from_local_part" {
  description = <<-EOT
    Local part of the sending address; the full address is
    <from_local_part>@<domain_name>. It never receives mail (no inbound rules) —
    replies go to the visitor via the message's Reply-To.
  EOT
  type        = string
  default     = "contact"
}

variable "recipient_email" {
  description = "Where contact-form submissions are delivered (the site owner's inbox)."
  type        = string
}

variable "verify_recipient_identity" {
  description = <<-EOT
    Create an SES *email address* identity for var.recipient_email so it can
    receive mail while the account is still in the SES sandbox (sandbox senders
    may only mail verified destinations; the owner clicks the AWS verification
    link once).

    An address identity is an account+region singleton, so exactly ONE
    environment may own it — leave this false on dev and true on prod, and dev
    inherits the verification. Flipping it on in both stacks makes the second
    apply fail with AlreadyExistsException.
  EOT
  type        = bool
  default     = false
}

variable "lambda_zip_path" {
  description = "Path to the bundled handler zip (services/contact/dist/handler.zip)."
  type        = string
}
