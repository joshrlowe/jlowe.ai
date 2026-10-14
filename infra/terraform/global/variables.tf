variable "aws_account_id" {
  description = "AWS account that owns all jlowe.ai infrastructure"
  type        = string
  default     = "509399626117"
}

variable "github_repos" {
  description = <<-EOT
    GitHub repos allowed to assume the CI roles, written as the OIDC `sub`
    claim prefix that follows "repo:". joshrlowe/velocity issues immutable
    subjects (owner@owner_id/name@repo_id); check a repo's prefix with
    `gh api repos/OWNER/NAME/actions/oidc/customization/sub`. Both repos are
    trusted while Velocity moves from joshrlowe/jlowe.ai (v2 branch) to
    joshrlowe/velocity; drop jlowe.ai once velocity has run a plan and apply.
  EOT
  type        = list(string)
  default     = ["joshrlowe/jlowe.ai", "joshrlowe@89754639/velocity@1406039318"]
}
