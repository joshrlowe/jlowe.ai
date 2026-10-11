variable "aws_account_id" {
  description = "AWS account that owns all jlowe.ai infrastructure"
  type        = string
  default     = "509399626117"
}

variable "github_repos" {
  description = <<-EOT
    owner/name of the GitHub repos allowed to assume the CI roles. Both repos
    are trusted while Velocity moves from joshrlowe/jlowe.ai (v2 branch) to
    joshrlowe/velocity; drop jlowe.ai once velocity has run a plan and apply.
  EOT
  type        = list(string)
  default     = ["joshrlowe/jlowe.ai", "joshrlowe/velocity"]
}
