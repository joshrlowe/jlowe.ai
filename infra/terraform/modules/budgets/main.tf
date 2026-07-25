# modules/budgets — account cost guardrails (Stage 2.4).
#
# A monthly COST budget with 50/80/100% notifications (ACTUAL + FORECASTED)
# fanned out through a dedicated SNS topic. Owners get an email subscription;
# the topic can also feed the alarms module so cost + operational alerts share
# one notification channel.
#
# NOTE: thresholds here are USD spend limits, unrelated to repo-root budgets.json
# (that file is the client-side JS bundle-size budget).

# --- SNS topic for budget alerts --------------------------------------------
resource "aws_sns_topic" "budget_alerts" {
  name = "jlowe-ai-budget-alerts-${var.environment}"
}

# AWS Budgets publishes notifications through the budgets service principal, so
# the topic policy must explicitly allow it (unlike CloudWatch alarm actions,
# which need no topic policy for same-account publishes).
data "aws_iam_policy_document" "budget_sns" {
  statement {
    sid     = "AllowBudgetsPublish"
    effect  = "Allow"
    actions = ["SNS:Publish"]

    principals {
      type        = "Service"
      identifiers = ["budgets.amazonaws.com"]
    }

    resources = [aws_sns_topic.budget_alerts.arn]
  }
}

resource "aws_sns_topic_policy" "budget_alerts" {
  arn    = aws_sns_topic.budget_alerts.arn
  policy = data.aws_iam_policy_document.budget_sns.json
}

# Email subscription(s) for the owner(s). Each address must confirm the AWS
# subscription email once before it starts receiving alerts.
resource "aws_sns_topic_subscription" "email" {
  for_each = toset(var.alert_emails)

  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# --- Monthly cost budget -----------------------------------------------------
locals {
  # 50/80/100% ACTUAL plus 80/100% FORECASTED — forecast warnings give lead time
  # before spend actually lands; a 50% forecast is noisy this early in a month.
  notifications = [
    { threshold = 50, type = "ACTUAL" },
    { threshold = 80, type = "ACTUAL" },
    { threshold = 100, type = "ACTUAL" },
    { threshold = 80, type = "FORECASTED" },
    { threshold = 100, type = "FORECASTED" },
  ]
}

resource "aws_budgets_budget" "monthly" {
  name         = "jlowe-ai-monthly-cost-${var.environment}"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  dynamic "notification" {
    for_each = local.notifications
    content {
      comparison_operator       = "GREATER_THAN"
      threshold                 = notification.value.threshold
      threshold_type            = "PERCENTAGE"
      notification_type         = notification.value.type
      subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
    }
  }
}
