output "site_bucket_name" {
  value = module.cdn.site_bucket_name
}

output "distribution_id" {
  value = module.cdn.distribution_id
}

output "distribution_domain_name" {
  value = module.cdn.distribution_domain_name
}

output "chat_endpoint" {
  description = "Streaming Function URL for the chat Lambda"
  value       = module.chat.function_url
}

output "chat_function_name" {
  description = "Chat Lambda name (gha-deploy-chat targets this)"
  value       = module.chat.function_name
}

output "contact_endpoint" {
  description = "Function URL for the contact Lambda (reached in production via /api/contact)"
  value       = module.contact.function_url
}

output "contact_function_name" {
  description = "Contact Lambda name (gha-deploy-contact targets this)"
  value       = module.contact.function_name
}

output "contact_from_address" {
  description = "Verified SES address the contact form sends from"
  value       = module.contact.from_address
}

output "budget_id" {
  description = "Monthly cost budget id (null when budgets are disabled)."
  value       = var.enable_budgets ? module.budgets[0].budget_id : null
}

output "budget_sns_topic_arn" {
  description = "Budget-alerts SNS topic ARN (null when budgets are disabled)."
  value       = var.enable_budgets ? module.budgets[0].sns_topic_arn : null
}

output "alarm_names" {
  description = "CloudWatch alarm names (null when alarms are disabled)."
  value       = var.enable_alarms ? module.alarms[0].alarm_names : null
}

output "ops_sns_topic_arn" {
  description = "Ops-alerts SNS topic ARN (null when alarms are disabled or no ops emails set)."
  value       = var.enable_alarms ? module.alarms[0].ops_sns_topic_arn : null
}

output "waf_web_acl_arn" {
  description = "ARN of the edge WAF Web ACL associated with the distribution"
  value       = module.waf.web_acl_arn
}
