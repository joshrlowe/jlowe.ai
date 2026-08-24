output "function_url" {
  description = "Full HTTPS Function URL (https://<id>.lambda-url.<region>.on.aws/)"
  value       = aws_lambda_function_url.contact.function_url
}

output "function_url_host" {
  description = <<-EOT
    Just the hostname of the Function URL, for the CloudFront custom origin
    (origins take a domain, not a scheme/path). Strips https:// and the trailing
    slash off the full URL.
  EOT
  value       = trimsuffix(trimprefix(aws_lambda_function_url.contact.function_url, "https://"), "/")
}

output "function_name" {
  description = "Lambda function name (deploy workflow targets this)."
  value       = aws_lambda_function.contact.function_name
}

output "function_arn" {
  description = "Lambda function ARN."
  value       = aws_lambda_function.contact.arn
}

output "from_address" {
  description = "The verified address the contact Lambda sends from."
  value       = local.from_address
}

output "sender_identity_arn" {
  description = "ARN of the SES domain identity the send permission is scoped to."
  value       = aws_sesv2_email_identity.sender.arn
}
