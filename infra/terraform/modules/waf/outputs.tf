output "web_acl_arn" {
  description = <<-EOT
    ARN of the Web ACL. CloudFront associates a WAF by ARN (not id): pass this to
    the cdn module's waf_web_acl_arn, which sets it as the distribution's
    web_acl_id.
  EOT
  value       = aws_wafv2_web_acl.this.arn
}

output "web_acl_id" {
  description = "Web ACL id."
  value       = aws_wafv2_web_acl.this.id
}

output "web_acl_name" {
  description = "Web ACL name."
  value       = aws_wafv2_web_acl.this.name
}
