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
