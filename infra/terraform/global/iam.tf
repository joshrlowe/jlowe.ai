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

  # gha-terraform may manage (and PassRole) only these role-name prefixes.
  # Covers Lambda exec roles (jlowe-ai-chat, -digest, -contact) and CI roles
  # (gha-deploy-*, gha-eval, gha-terraform*). First apply of the scoped
  # policy is lock-in — a missing prefix cannot be created afterwards.
  terraform_iam_role_arns = [
    "arn:aws:iam::${var.aws_account_id}:role/jlowe-ai-*",
    "arn:aws:iam::${var.aws_account_id}:role/gha-*",
  ]
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

# --- gha-deploy-contact: lambda code push -----------------------------------
# Same shape as gha-deploy-chat, separate role so each deploy workflow can only
# ship its own function's code. Reuses the chat role's trust document (identical
# environment-scoped OIDC conditions).
resource "aws_iam_role" "deploy_contact" {
  name               = "gha-deploy-contact"
  assume_role_policy = data.aws_iam_policy_document.deploy_chat_trust.json
}

data "aws_iam_policy_document" "deploy_contact" {
  statement {
    sid    = "UpdateContactFunctionCode"
    effect = "Allow"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
    ]
    resources = ["arn:aws:lambda:us-east-1:${var.aws_account_id}:function:jlowe-ai-contact-*"]
  }
}

resource "aws_iam_role_policy" "deploy_contact" {
  name   = "deploy-contact"
  role   = aws_iam_role.deploy_contact.id
  policy = data.aws_iam_policy_document.deploy_contact.json
}

# --- gha-eval: nightly golden evals (Bedrock only) --------------------------
# Trust matches gha-deploy-chat (environment:dev|prod) so eval-nightly.yml
# can assume it from the `prod` GitHub environment. No Lambda/Dynamo/SES —
# this role exists to re-embed and to Converse two probes, nothing else.
resource "aws_iam_role" "eval" {
  name               = "gha-eval"
  assume_role_policy = data.aws_iam_policy_document.deploy_chat_trust.json
}

locals {
  eval_bedrock_regions = ["us-east-1", "us-east-2", "us-west-2"]
  eval_haiku_id        = "anthropic.claude-haiku-4-5-20251001-v1:0"
  eval_haiku_profile   = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}

data "aws_iam_policy_document" "eval" {
  statement {
    sid    = "BedrockInvokeHaiku"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]
    resources = concat(
      [
        "arn:aws:bedrock:us-east-1:${var.aws_account_id}:inference-profile/${local.eval_haiku_profile}",
      ],
      [
        for region in local.eval_bedrock_regions :
        "arn:aws:bedrock:${region}::foundation-model/${local.eval_haiku_id}"
      ],
    )
  }

  statement {
    sid     = "BedrockInvokeTitanEmbed"
    effect  = "Allow"
    actions = ["bedrock:InvokeModel"]
    resources = [
      for region in local.eval_bedrock_regions :
      "arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0"
    ]
  }
}

resource "aws_iam_role_policy" "eval" {
  name   = "eval"
  role   = aws_iam_role.eval.id
  policy = data.aws_iam_policy_document.eval.json
}

# --- gha-terraform: gated apply (scoped, not AdministratorAccess) -----------
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

# Service allow-list for what the stacks actually manage. Twin resources as of
# 2026-08-25 are covered by the named wildcards, not extra statements:
#   DynamoDB  table/jlowe-ai-*            (sessions + digest GSI)
#   Lambda    function/jlowe-ai-*         (chat, digest, contact)
#   events    rule/jlowe-ai-*             (digest cron)
#   SSM       parameter/jlowe-ai*         (Langfuse SecureStrings)
#   SES       identity/*                  (domain + sandbox recipient)
#   gha-eval  role/gha-*
# Still broad: CloudFront, ACM, and WAFv2 ARNs are opaque IDs so those writes
# stay account-scoped. A step down from AdministratorAccess — no EC2/RDS/
# Organizations/IAM users — not a substitute for the OIDC trust + reviewer gate.
data "aws_iam_policy_document" "terraform_apply" {
  statement {
    sid    = "ReadForRefresh"
    effect = "Allow"
    actions = [
      "acm:Describe*",
      "acm:Get*",
      "acm:List*",
      "budgets:Describe*",
      "budgets:View*",
      "cloudfront:Describe*",
      "cloudfront:Get*",
      "cloudfront:List*",
      "cloudwatch:Describe*",
      "cloudwatch:Get*",
      "cloudwatch:List*",
      "dynamodb:Describe*",
      "dynamodb:List*",
      "events:Describe*",
      "events:List*",
      "iam:Get*",
      "iam:List*",
      "lambda:Describe*",
      "lambda:Get*",
      "lambda:List*",
      "logs:Describe*",
      "logs:Get*",
      "logs:List*",
      "route53:Get*",
      "route53:List*",
      "s3:Describe*",
      "s3:Get*",
      "s3:List*",
      "ses:Describe*",
      "ses:Get*",
      "ses:List*",
      "sns:Get*",
      "sns:List*",
      "ssm:Describe*",
      "ssm:Get*",
      "ssm:List*",
      "wafv2:Describe*",
      "wafv2:Get*",
      "wafv2:List*",
      "tag:GetResources",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "S3NamedBuckets"
    effect = "Allow"
    actions = [
      "s3:*",
    ]
    resources = [
      "arn:aws:s3:::jlowe-ai-*",
      "arn:aws:s3:::jlowe-ai-*/*",
    ]
  }

  statement {
    sid    = "IamNamedRolesAndPolicies"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreatePolicy",
      "iam:CreatePolicyVersion",
      "iam:CreateRole",
      "iam:DeletePolicy",
      "iam:DeletePolicyVersion",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy",
      "iam:SetDefaultPolicyVersion",
      "iam:TagPolicy",
      "iam:TagRole",
      "iam:UntagPolicy",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:UpdateRole",
      "iam:UpdateRoleDescription",
    ]
    resources = concat(local.terraform_iam_role_arns, [
      "arn:aws:iam::${var.aws_account_id}:policy/jlowe-ai-*",
      "arn:aws:iam::${var.aws_account_id}:policy/gha-*",
    ])
  }

  statement {
    sid    = "PassNamedRoles"
    effect = "Allow"
    actions = [
      "iam:PassRole",
    ]
    resources = local.terraform_iam_role_arns
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values = [
        "lambda.amazonaws.com",
        "events.amazonaws.com",
      ]
    }
  }

  statement {
    sid    = "ServiceLinkedRoles"
    effect = "Allow"
    actions = [
      "iam:CreateServiceLinkedRole",
    ]
    resources = [
      "arn:aws:iam::${var.aws_account_id}:role/aws-service-role/delivery.logs.amazonaws.com/*",
      "arn:aws:iam::${var.aws_account_id}:role/aws-service-role/budgets.amazonaws.com/*",
    ]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values = [
        "delivery.logs.amazonaws.com",
        "budgets.amazonaws.com",
      ]
    }
  }

  statement {
    sid    = "LambdaNamedFunctions"
    effect = "Allow"
    actions = [
      "lambda:*",
    ]
    resources = [
      "arn:aws:lambda:us-east-1:${var.aws_account_id}:function:jlowe-ai-*",
      "arn:aws:lambda:us-east-1:${var.aws_account_id}:function:jlowe-ai-*:*",
    ]
  }

  statement {
    sid    = "CloudWatchAlarms"
    effect = "Allow"
    actions = [
      "cloudwatch:*",
    ]
    resources = [
      "arn:aws:cloudwatch:us-east-1:${var.aws_account_id}:alarm:jlowe-ai-*",
    ]
  }

  statement {
    sid    = "SnsNamedTopics"
    effect = "Allow"
    actions = [
      "sns:*",
    ]
    resources = [
      "arn:aws:sns:us-east-1:${var.aws_account_id}:jlowe-ai-*",
    ]
  }

  statement {
    sid    = "Budgets"
    effect = "Allow"
    actions = [
      "budgets:*",
    ]
    resources = [
      "arn:aws:budgets::${var.aws_account_id}:budget/jlowe-ai-*",
    ]
  }

  statement {
    sid    = "Route53"
    effect = "Allow"
    actions = [
      "route53:ChangeResourceRecordSets",
      "route53:ChangeTagsForResource",
      "route53:CreateHostedZone",
      "route53:DeleteHostedZone",
      "route53:UpdateHostedZoneComment",
    ]
    resources = ["*"]
  }

  # CloudFront / ACM / WAFv2 identifiers are random, so writes stay
  # account-scoped. Service prefixes still exclude unrelated APIs.
  statement {
    sid    = "CloudFrontAcmWaf"
    effect = "Allow"
    actions = [
      "acm:*",
      "cloudfront:*",
      "wafv2:*",
    ]
    resources = ["*"]
  }

  # CloudFront standard logging v2 (delivery source/destination/delivery) plus
  # Lambda log groups. Delivery APIs require Resource "*".
  statement {
    sid    = "Logs"
    effect = "Allow"
    actions = [
      "logs:*",
    ]
    resources = ["*"]
  }

  # SES v2 identities are domain names (jlowe.ai / dev.jlowe.ai) and a sandbox
  # recipient address — not the jlowe-ai-* prefix.
  statement {
    sid    = "SesIdentities"
    effect = "Allow"
    actions = [
      "ses:*",
    ]
    resources = [
      "arn:aws:ses:us-east-1:${var.aws_account_id}:identity/*",
      "arn:aws:ses:us-east-1:${var.aws_account_id}:configuration-set/jlowe-ai-*",
    ]
  }

  statement {
    sid    = "DynamoDbNamedTables"
    effect = "Allow"
    actions = [
      "dynamodb:*",
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:${var.aws_account_id}:table/jlowe-ai-*",
      "arn:aws:dynamodb:us-east-1:${var.aws_account_id}:table/jlowe-ai-*/*",
    ]
  }

  statement {
    sid    = "EventBridge"
    effect = "Allow"
    actions = [
      "events:*",
    ]
    resources = [
      "arn:aws:events:us-east-1:${var.aws_account_id}:event-bus/default",
      "arn:aws:events:us-east-1:${var.aws_account_id}:event-bus/jlowe-ai-*",
      "arn:aws:events:us-east-1:${var.aws_account_id}:rule/jlowe-ai-*",
      "arn:aws:events:us-east-1:${var.aws_account_id}:rule/jlowe-ai-*/*",
      "arn:aws:events:us-east-1:${var.aws_account_id}:rule/*/jlowe-ai-*",
    ]
  }

  statement {
    sid    = "SsmNamedParameters"
    effect = "Allow"
    actions = [
      "ssm:*",
    ]
    resources = [
      "arn:aws:ssm:us-east-1:${var.aws_account_id}:parameter/jlowe-ai*",
    ]
  }

  statement {
    sid    = "KmsForSsmSecureString"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
    ]
    resources = [
      "arn:aws:kms:us-east-1:${var.aws_account_id}:key/*",
    ]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.us-east-1.amazonaws.com"]
    }
  }

  statement {
    sid    = "DenyIamUserPrivilegeEscalation"
    effect = "Deny"
    actions = [
      "iam:AttachUserPolicy",
      "iam:CreateAccessKey",
      "iam:CreateUser",
      "iam:PutUserPolicy",
      "iam:*LoginProfile*",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "DenyUpdateAssumeRolePolicyOutsidePrefixes"
    effect = "Deny"
    actions = [
      "iam:UpdateAssumeRolePolicy",
    ]
    not_resources = local.terraform_iam_role_arns
  }

  statement {
    sid    = "DenyAttachHighPrivilegeManagedPolicies"
    effect = "Deny"
    actions = [
      "iam:AttachGroupPolicy",
      "iam:AttachRolePolicy",
      "iam:AttachUserPolicy",
    ]
    resources = ["*"]
    condition {
      test     = "ArnEquals"
      variable = "iam:PolicyARN"
      values = [
        "arn:aws:iam::aws:policy/AdministratorAccess",
        "arn:aws:iam::aws:policy/IAMFullAccess",
        "arn:aws:iam::aws:policy/PowerUserAccess",
      ]
    }
  }
}

resource "aws_iam_role_policy" "terraform_apply" {
  name   = "terraform-apply"
  role   = aws_iam_role.terraform.id
  policy = data.aws_iam_policy_document.terraform_apply.json
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
