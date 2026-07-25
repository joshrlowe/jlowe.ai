# modules/alarms — CloudWatch alarms for the pay-per-token chat path (Stage 2.4).
#
# Guards the two surfaces that turn traffic (or abuse) into spend and outages:
#   - the chat Lambda (Errors, Throttles, and optionally Duration p99 +
#     ConcurrentExecutions), and
#   - the CloudFront distribution fronting it (5xxErrorRate).
#
# Alarms fan out to an optional ops SNS topic created here (owner emails) and/or
# any extra topic ARNs passed in (e.g. the budgets module topic) so cost and
# operational alerts can share one channel.

# --- Optional ops SNS topic --------------------------------------------------
# Created only when owner emails are supplied. CloudWatch alarm actions publish
# to same-account SNS without any topic policy, so none is needed here.
resource "aws_sns_topic" "ops" {
  count = length(var.ops_alert_emails) > 0 ? 1 : 0
  name  = "jlowe-ai-ops-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "ops_email" {
  for_each = toset(var.ops_alert_emails)

  topic_arn = aws_sns_topic.ops[0].arn
  protocol  = "email"
  endpoint  = each.value
}

locals {
  alarm_actions = concat(
    aws_sns_topic.ops[*].arn,
    var.extra_alarm_action_arns,
  )
}

# --- Lambda alarms -----------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "jlowe-ai-chat-errors-${var.environment}"
  alarm_description   = "Chat Lambda function errors — failed invocations still bill for duration and can mask retries."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  statistic           = "Sum"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = var.lambda_error_threshold
  period              = var.period
  evaluation_periods  = var.evaluation_periods
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "jlowe-ai-chat-throttles-${var.environment}"
  alarm_description   = "Chat Lambda throttles — requests rejected at the concurrency ceiling (user-visible failures)."
  namespace           = "AWS/Lambda"
  metric_name         = "Throttles"
  statistic           = "Sum"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = var.lambda_throttle_threshold
  period              = var.period
  evaluation_periods  = var.evaluation_periods
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration_p99" {
  count = var.enable_duration_alarm ? 1 : 0

  alarm_name          = "jlowe-ai-chat-duration-p99-${var.environment}"
  alarm_description   = "Chat Lambda p99 duration — sustained long invocations drive Bedrock + Lambda cost and approach the timeout."
  namespace           = "AWS/Lambda"
  metric_name         = "Duration"
  extended_statistic  = "p99"
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.lambda_duration_p99_threshold_ms
  period              = var.period
  evaluation_periods  = var.evaluation_periods
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "lambda_concurrency" {
  count = var.enable_concurrency_alarm ? 1 : 0

  alarm_name          = "jlowe-ai-chat-concurrency-${var.environment}"
  alarm_description   = "Chat Lambda concurrent executions — early warning before hitting the account/reserved concurrency ceiling."
  namespace           = "AWS/Lambda"
  metric_name         = "ConcurrentExecutions"
  statistic           = "Maximum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.lambda_concurrent_executions_threshold
  period              = var.period
  evaluation_periods  = var.evaluation_periods
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_function_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

# --- CloudFront alarm --------------------------------------------------------
# CloudFront publishes to AWS/CloudFront in us-east-1 only, with a Global Region
# dimension. This module's provider is already us-east-1, so no aliased provider
# is required. 5xxErrorRate is a default distribution metric (no extra metrics
# subscription needed).
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  alarm_name          = "jlowe-ai-cdn-5xx-rate-${var.environment}"
  alarm_description   = "CloudFront 5xx error rate — origin (chat Lambda / S3) failures reaching users at the edge."
  namespace           = "AWS/CloudFront"
  metric_name         = "5xxErrorRate"
  statistic           = "Average"
  unit                = "Percent"
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.cloudfront_5xx_rate_threshold
  period              = var.cloudfront_period
  evaluation_periods  = var.evaluation_periods
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
    Region         = "Global"
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}
