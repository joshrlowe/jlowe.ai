output "site_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "site_bucket_arn" {
  value = aws_s3_bucket.site.arn
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.site.arn
}

output "distribution_domain_name" {
  description = "dxxxx.cloudfront.net — smoke-test target before DNS delegation"
  value       = aws_cloudfront_distribution.site.domain_name
}
