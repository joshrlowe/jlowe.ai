variable "aws_account_id" {
  description = "AWS account that owns all jlowe.ai infrastructure"
  type        = string
  default     = "509399626117"
}

variable "github_repo" {
  description = "owner/name of the GitHub repo allowed to assume the CI roles"
  type        = string
  default     = "joshrlowe/jlowe.ai"
}
