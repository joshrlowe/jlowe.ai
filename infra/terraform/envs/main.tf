# The hosted zone is an account singleton owned by the global stack; read it
# here via data source (the spec's "import via data source").
data "aws_route53_zone" "primary" {
  name = "jlowe.ai"
}

module "cdn" {
  source = "../modules/cdn"

  environment    = var.environment
  domain_name    = var.domain_name
  zone_id        = data.aws_route53_zone.primary.zone_id
  dns_delegated  = var.dns_delegated
  robots_noindex = var.robots_noindex
}

module "chat" {
  source = "../modules/chat"

  environment      = var.environment
  bedrock_model_id = var.bedrock_model_id
  lambda_zip_path  = "${path.module}/../../../services/chat/dist/handler.zip"
  # cloudfront_distribution_arn is intentionally left null until the follow-up PR
  # wires the /api/chat* behavior — passing module.cdn.distribution_arn here now
  # would create an apply-ordering cycle.
}

# Skeleton modules — wired here when implemented in their phases:
# module "waf" {
#   source      = "../modules/waf"
#   environment = var.environment
# }
# module "knowledge_base" {
#   source      = "../modules/knowledge_base"
#   environment = var.environment
# }
# module "budgets" {
#   source      = "../modules/budgets"
#   environment = var.environment
# }
