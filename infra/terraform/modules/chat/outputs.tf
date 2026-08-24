output "function_url" {
  description = "Full HTTPS Function URL (https://<id>.lambda-url.<region>.on.aws/)"
  value       = aws_lambda_function_url.chat.function_url
}

output "function_url_host" {
  description = <<-EOT
    Just the hostname of the Function URL, for a future CloudFront custom origin
    (origins take a domain, not a scheme/path). Strips https:// and the trailing
    slash off the full URL.
  EOT
  value       = trimsuffix(trimprefix(aws_lambda_function_url.chat.function_url, "https://"), "/")
}

output "function_name" {
  description = "Lambda function name (deploy workflow targets this)."
  value       = aws_lambda_function.chat.function_name
}

output "function_arn" {
  description = "Lambda function ARN."
  value       = aws_lambda_function.chat.arn
}

output "sessions_table_name" {
  description = "DynamoDB table for chat sessions (digest Lambda reads the sparse GSI)."
  value       = aws_dynamodb_table.sessions.name
}

output "sessions_table_arn" {
  description = "ARN of the chat-sessions table, including for GSI IAM in the digest function."
  value       = aws_dynamodb_table.sessions.arn
}

output "digest_function_name" {
  description = "Nightly digest Lambda name (deploy-chat updates this alongside chat)."
  value       = aws_lambda_function.digest.function_name
}
