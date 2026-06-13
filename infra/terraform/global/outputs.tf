output "hosted_zone_id" {
  description = "Route53 zone id for jlowe.ai"
  value       = aws_route53_zone.primary.zone_id
}

output "name_servers" {
  description = "Set these four as the custom nameservers at Namecheap"
  value       = aws_route53_zone.primary.name_servers
}

output "deploy_web_role_arn" {
  value = aws_iam_role.deploy_web.arn
}

output "terraform_role_arn" {
  value = aws_iam_role.terraform.arn
}

output "terraform_plan_role_arn" {
  value = aws_iam_role.terraform_plan.arn
}
