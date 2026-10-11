# Vercel OIDC federation for the v1 site (joshrlowe/jlowe.ai `main`, Vercel
# project `jlowe-ai`). Its chat functions exchange their Vercel-issued OIDC
# token for jlowe-ai-vercel-v1 through @vercel/oidc-aws-credentials-provider,
# so the Vercel project holds no long-lived AWS keys. The project must have
# "Secure backend access with OIDC federation" enabled in Team issuer mode and
# AWS_ROLE_ARN set to the output below.
#
# Issuer, audience, and subject formats are from https://vercel.com/docs/oidc/aws
# (Team issuer mode).

locals {
  vercel_team_slug   = "joshua-lowes-projects"
  vercel_project     = "jlowe-ai"
  vercel_issuer_host = "oidc.vercel.com/${local.vercel_team_slug}"
  vercel_audience    = "https://vercel.com/${local.vercel_team_slug}"
}

resource "aws_iam_openid_connect_provider" "vercel" {
  url            = "https://${local.vercel_issuer_host}"
  client_id_list = [local.vercel_audience]
}

data "aws_iam_policy_document" "vercel_v1_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.vercel.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.vercel_issuer_host}:aud"
      values   = [local.vercel_audience]
    }
    # Production and preview deployments of this one project; never
    # `development` (local `vercel dev` uses a developer's own credentials).
    condition {
      test     = "StringEquals"
      variable = "${local.vercel_issuer_host}:sub"
      values = [
        for env in ["production", "preview"] :
        "owner:${local.vercel_team_slug}:project:${local.vercel_project}:environment:${env}"
      ]
    }
  }
}

resource "aws_iam_role" "vercel_v1" {
  name               = "jlowe-ai-vercel-v1"
  assume_role_policy = data.aws_iam_policy_document.vercel_v1_trust.json
}

# Same Bedrock surface as gha-eval: Haiku 4.5 through the US inference profile
# (plus the member foundation-model ARNs it routes to) and Titan v2 embeddings.
data "aws_iam_policy_document" "vercel_v1" {
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

resource "aws_iam_role_policy" "vercel_v1" {
  name   = "bedrock"
  role   = aws_iam_role.vercel_v1.id
  policy = data.aws_iam_policy_document.vercel_v1.json
}

output "vercel_v1_role_arn" {
  description = "Set as AWS_ROLE_ARN on the Vercel project jlowe-ai (production + preview)"
  value       = aws_iam_role.vercel_v1.arn
}
