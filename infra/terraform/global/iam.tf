# GitHub Actions OIDC roles. The provider itself is created by bootstrap.sh
# (kept out of TF state). Write roles trust environment-scoped subjects because
# a job that references a GitHub environment emits sub=repo:...:environment:NAME
# regardless of branch — so these survive the v2->main cutover with no edits.

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_arn = data.aws_iam_openid_connect_provider.github.arn
  repo     = var.github_repo
}

# --- gha-deploy-web: s3 sync + CloudFront invalidation ----------------------
data "aws_iam_policy_document" "deploy_web_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.repo}:environment:dev",
        "repo:${local.repo}:environment:prod",
      ]
    }
  }
}

resource "aws_iam_role" "deploy_web" {
  name               = "gha-deploy-web"
  assume_role_policy = data.aws_iam_policy_document.deploy_web_trust.json
}

data "aws_iam_policy_document" "deploy_web" {
  # Bucket/distribution ARNs are per-env (envs stack), so wildcard on the
  # load-bearing naming convention enforced by modules/cdn.
  statement {
    sid       = "ListSiteBuckets"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::jlowe-ai-site-*"]
  }
  statement {
    sid       = "ReadWriteSiteObjects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::jlowe-ai-site-*/*"]
  }
  statement {
    sid       = "InvalidateDistributions"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = ["arn:aws:cloudfront::${var.aws_account_id}:distribution/*"]
  }
}

resource "aws_iam_role_policy" "deploy_web" {
  name   = "deploy-web"
  role   = aws_iam_role.deploy_web.id
  policy = data.aws_iam_policy_document.deploy_web.json
}

# --- gha-deploy-chat: lambda code push --------------------------------------
# Mirrors gha-deploy-web: same environment-scoped OIDC trust (dev|prod), but
# permissioned only to ship new chat-Lambda code. Config (env/IAM/memory) stays
# with the gated gha-terraform role; this role can never touch it.
data "aws_iam_policy_document" "deploy_chat_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.repo}:environment:dev",
        "repo:${local.repo}:environment:prod",
      ]
    }
  }
}

resource "aws_iam_role" "deploy_chat" {
  name               = "gha-deploy-chat"
  assume_role_policy = data.aws_iam_policy_document.deploy_chat_trust.json
}

data "aws_iam_policy_document" "deploy_chat" {
  # Function names are per-env (envs stack: jlowe-ai-chat-dev|prod), so wildcard
  # on the naming convention enforced by modules/chat. UpdateFunctionCode only —
  # no UpdateFunctionConfiguration (Terraform owns config). The Get* reads are
  # what `aws lambda wait function-updated` polls after the code push
  # (GetFunctionConfiguration), plus GetFunction for pre/post-deploy checks.
  statement {
    sid    = "UpdateChatFunctionCode"
    effect = "Allow"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
    ]
    resources = ["arn:aws:lambda:us-east-1:${var.aws_account_id}:function:jlowe-ai-chat-*"]
  }
}

resource "aws_iam_role_policy" "deploy_chat" {
  name   = "deploy-chat"
  role   = aws_iam_role.deploy_chat.id
  policy = data.aws_iam_policy_document.deploy_chat.json
}

# --- gha-terraform: gated apply (AdministratorAccess) -----------------------
data "aws_iam_policy_document" "terraform_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.repo}:environment:terraform-dev",
        "repo:${local.repo}:environment:terraform-prod",
      ]
    }
  }
}

resource "aws_iam_role" "terraform" {
  name               = "gha-terraform"
  assume_role_policy = data.aws_iam_policy_document.terraform_trust.json
}

# TODO(later-phase): scope down from AdministratorAccess once the resource
# surface (Lambda/Bedrock IAM, WAF, budgets) stabilizes. The real boundary
# today is the trust policy (single repo, exact environment subs) plus the
# required-reviewer environment gate on applies.
resource "aws_iam_role_policy_attachment" "terraform_admin" {
  role       = aws_iam_role.terraform.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# --- gha-terraform-plan: PR plans (read-only, reviewer-free) ----------------
data "aws_iam_policy_document" "terraform_plan_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      # PR plans must not be reviewer-gated; fork PRs can't mint OIDC tokens.
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.repo}:pull_request",
        "repo:${local.repo}:ref:refs/heads/v2",
        "repo:${local.repo}:ref:refs/heads/main",
      ]
    }
  }
}

resource "aws_iam_role" "terraform_plan" {
  name               = "gha-terraform-plan"
  assume_role_policy = data.aws_iam_policy_document.terraform_plan_trust.json
}

# ReadOnlyAccess covers state reads (GetObject/ListBucket) and the describe/list
# calls a refresh-only plan makes. Plans run with -lock=false, so no state
# write permission is needed.
resource "aws_iam_role_policy_attachment" "terraform_plan_ro" {
  role       = aws_iam_role.terraform_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}
