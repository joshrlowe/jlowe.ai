output "budget_id" {
  description = "ID of the monthly cost budget."
  value       = aws_budgets_budget.monthly.id
}

output "sns_topic_arn" {
  description = "ARN of the budget-alerts SNS topic (also reusable as an alarm action)."
  value       = aws_sns_topic.budget_alerts.arn
}
