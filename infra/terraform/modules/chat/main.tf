# modules/chat — the Bedrock-backed digital-twin chat backend.
#
# Deploys services/chat as a streaming Lambda behind an IAM-auth Function URL.
# Terraform owns the function's *config* (runtime, memory, env, IAM); the
# deploy-chat workflow owns the *code* (lambda:UpdateFunctionCode) — see the
# lifecycle ignore_changes on filename/source_code_hash below.

data "aws_caller_identity" "current" {}

locals {
  account_id    = data.aws_caller_identity.current.account_id
  function_name = "jlowe-ai-chat-${var.environment}"
  log_group     = "/aws/lambda/jlowe-ai-chat-${var.environment}"

  # The US inference profile us.anthropic.claude-haiku-4-5-20251001-v1:0 routes
  # to the foundation model in three regions (discovered via
  # `aws bedrock get-inference-profile`). InvokeModel is authorized against the
  # *member* foundation-model ARNs, not just the profile ARN — so the policy
  # lists all three plus the profile itself. No bedrock:* / Resource="*".
  bedrock_model_regions = ["us-east-1", "us-east-2", "us-west-2"]
  bedrock_model_arns = [
    for region in local.bedrock_model_regions :
    "arn:aws:bedrock:${region}::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0"
  ]
  bedrock_inference_profile_arn = "arn:aws:bedrock:us-east-1:${local.account_id}:inference-profile/${var.bedrock_model_id}"

  titan_embed_model_arns = [
    for region in local.bedrock_model_regions :
    "arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0"
  ]
}

# --- IAM role + least-privilege policy --------------------------------------
data "aws_iam_policy_document" "lambda_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "chat" {
  name               = "jlowe-ai-chat-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

data "aws_iam_policy_document" "chat" {
  # Scoped to this function's own log group/streams (AWSLambdaBasicExecutionRole
  # equivalent, but resource-scoped instead of "*").
  statement {
    sid       = "Logs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.chat.arn}:*"]
  }

  # Bedrock least-privilege: invoke (incl. streaming) only the Haiku 4.5 US
  # inference profile and the foundation-model ARNs it fans out to.
  statement {
    sid    = "BedrockInvokeHaiku"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModelWithResponseStream",
      "bedrock:InvokeModel",
    ]
    resources = concat(
      [local.bedrock_inference_profile_arn],
      local.bedrock_model_arns,
    )
  }

  # Query-time Titan v2 embed for hybrid retrieval. InvokeModel only — the
  # embed API is not streamed. Same region list as Haiku; do not broaden Haiku.
  statement {
    sid       = "BedrockInvokeTitanEmbed"
    effect    = "Allow"
    actions   = ["bedrock:InvokeModel"]
    resources = local.titan_embed_model_arns
  }

  # Session row + message list. Query on the digest GSI is the digest Lambda
  # (PR 6), not this function — so the index ARN is not in this policy.
  statement {
    sid    = "ChatSessions"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
    ]
    resources = [aws_dynamodb_table.sessions.arn]
  }
}

# --- Sessions table ---------------------------------------------------------
# PK sessionId. Sparse GSI `digest` whose keys (digestPk / digestSk) are
# written only while qualified && !emailedToOwner, so the nightly digest is a
# Query with no filter and no scan. TTL on expiresAt (epoch seconds).
resource "aws_dynamodb_table" "sessions" {
  name         = "jlowe-ai-chat-sessions-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "digestPk"
    type = "S"
  }

  attribute {
    name = "digestSk"
    type = "S"
  }

  global_secondary_index {
    name = "digest"
    key_schema {
      attribute_name = "digestPk"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "digestSk"
      key_type       = "RANGE"
    }
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  deletion_protection_enabled = var.environment == "prod"
}

resource "aws_iam_role_policy" "chat" {
  name   = "chat"
  role   = aws_iam_role.chat.id
  policy = data.aws_iam_policy_document.chat.json
}

# --- Log group --------------------------------------------------------------
# Declared explicitly (not implicitly created by Lambda) so retention is managed
# and the IAM policy can scope to a known ARN.
resource "aws_cloudwatch_log_group" "chat" {
  name              = local.log_group
  retention_in_days = 14
}

# --- Function ---------------------------------------------------------------
resource "aws_lambda_function" "chat" {
  function_name = local.function_name
  role          = aws_iam_role.chat.arn
  runtime       = "nodejs22.x"
  handler       = "handler.handler"
  filename      = var.lambda_zip_path
  # Bind config (env/memory) drift to the *committed placeholder* hash; real
  # code hashes are pushed out-of-band by the deploy workflow and ignored below.
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      BEDROCK_MODEL_ID       = var.bedrock_model_id
      CHAT_SESSIONS_TABLE    = aws_dynamodb_table.sessions.name
      CALCOM_USERNAME        = var.calcom_username
      CALCOM_EVENT_TYPE_SLUG = var.calcom_event_type_slug
    }
  }

  # The deploy-chat workflow (lambda:UpdateFunctionCode) owns the code bytes.
  # Terraform owns everything else; ignoring these two prevents every plan from
  # trying to revert the function to the committed placeholder zip.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  depends_on = [aws_cloudwatch_log_group.chat]
}

# --- Streaming Function URL (IAM-auth) --------------------------------------
# RESPONSE_STREAM so the digital twin can stream tokens; AWS_IAM so only a
# signed caller (CloudFront via OAC, added in a later PR) can reach it.
resource "aws_lambda_function_url" "chat" {
  function_name      = aws_lambda_function.chat.function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "RESPONSE_STREAM"
}

# The CloudFront → Function URL invoke permission lives in the cdn module (it
# needs the distribution ARN locally — defining it there avoids a cdn↔chat cycle).
