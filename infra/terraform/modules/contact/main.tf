# modules/contact — the SES-backed contact-form backend.
#
# Deploys services/contact as a buffered Lambda behind an IAM-auth Function URL,
# reached same-origin at /api/contact* through the CloudFront behavior defined in
# modules/cdn (OAC-signed, exactly like /api/chat). Terraform owns the function's
# *config* (runtime, memory, env, IAM); the deploy-contact workflow owns the
# *code* (lambda:UpdateFunctionCode) — see the lifecycle ignore_changes below.
#
# Why SES and not a third-party form vendor: it is the same account, the same
# IAM/OIDC story, no new secret to rotate, and the send permission is scoped to
# one identity and one From address.

locals {
  function_name = "jlowe-ai-contact-${var.environment}"
  log_group     = "/aws/lambda/jlowe-ai-contact-${var.environment}"
  from_address  = "${var.from_local_part}@${var.domain_name}"
}

# --- SES sending identity ---------------------------------------------------
# A DOMAIN identity (dev.jlowe.ai vs jlowe.ai), not an address identity, so the
# two environments own distinct SES identities in the shared account/region.
# Easy DKIM is on by default for domain identities; the three CNAMEs below are
# what actually flips it to verified.
resource "aws_sesv2_email_identity" "sender" {
  email_identity = var.domain_name

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

resource "aws_route53_record" "dkim" {
  # Exactly three tokens per Easy DKIM identity; keyed by token so a key
  # rotation replaces records cleanly instead of churning on index shifts.
  for_each = toset(aws_sesv2_email_identity.sender.dkim_signing_attributes[0].tokens)

  zone_id         = var.zone_id
  name            = "${each.value}._domainkey.${var.domain_name}"
  type            = "CNAME"
  ttl             = 1800
  records         = ["${each.value}.dkim.amazonses.com"]
  allow_overwrite = true
}

# Sandbox-only recipient verification. See the variable's docs for why exactly
# one environment may own this.
resource "aws_sesv2_email_identity" "recipient" {
  count          = var.verify_recipient_identity ? 1 : 0
  email_identity = var.recipient_email
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

resource "aws_iam_role" "contact" {
  name               = "jlowe-ai-contact-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

data "aws_iam_policy_document" "contact" {
  # Scoped to this function's own log group/streams (AWSLambdaBasicExecutionRole
  # equivalent, but resource-scoped instead of "*").
  statement {
    sid       = "Logs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.contact.arn}:*"]
  }

  # SES least-privilege: SendEmail only, only through this environment's own
  # identity, and only from the one address the handler is configured with. No
  # ses:SendRawEmail (the handler uses Simple content), no bulk/templated send,
  # no identity management, no Resource = "*".
  statement {
    sid       = "SendContactEmail"
    effect    = "Allow"
    actions   = ["ses:SendEmail"]
    resources = [aws_sesv2_email_identity.sender.arn]
    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [local.from_address]
    }
  }
}

resource "aws_iam_role_policy" "contact" {
  name   = "contact"
  role   = aws_iam_role.contact.id
  policy = data.aws_iam_policy_document.contact.json
}

# --- Log group --------------------------------------------------------------
# Declared explicitly (not implicitly created by Lambda) so retention is managed
# and the IAM policy can scope to a known ARN.
resource "aws_cloudwatch_log_group" "contact" {
  name              = local.log_group
  retention_in_days = 14
}

# --- Function ---------------------------------------------------------------
resource "aws_lambda_function" "contact" {
  function_name = local.function_name
  role          = aws_iam_role.contact.arn
  runtime       = "nodejs22.x"
  handler       = "handler.handler"
  filename      = var.lambda_zip_path
  # Bind config drift to the *committed placeholder* hash; real code hashes are
  # pushed out-of-band by the deploy workflow and ignored below.
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  # One SES round-trip, no model inference — 15s/256MB is generous.
  timeout     = 15
  memory_size = 256

  environment {
    variables = {
      CONTACT_FROM_ADDRESS = local.from_address
      CONTACT_TO_ADDRESS   = var.recipient_email
    }
  }

  # The deploy-contact workflow (lambda:UpdateFunctionCode) owns the code bytes.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  depends_on = [aws_cloudwatch_log_group.contact]
}

# --- Function URL (IAM-auth, buffered) --------------------------------------
# BUFFERED (not RESPONSE_STREAM like chat): the response is a few dozen bytes of
# JSON, not a token stream. AWS_IAM so only a signed caller (CloudFront via the
# OAC in modules/cdn) can reach it — the URL is never publicly invocable.
resource "aws_lambda_function_url" "contact" {
  function_name      = aws_lambda_function.contact.function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "BUFFERED"
}

# The CloudFront → Function URL invoke permissions live in the cdn module (they
# need the distribution ARN locally — defining them there avoids a cdn↔contact
# cycle), exactly as for chat.
