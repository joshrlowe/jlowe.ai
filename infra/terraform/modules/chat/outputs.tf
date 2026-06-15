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
