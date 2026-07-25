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

  # dev sets this false to un-mask the chat origin's real 403 while debugging.
  mask_origin_403_as_404 = var.mask_origin_403_as_404

  # /api/chat* origin + the CloudFront→FunctionURL invoke permission live here
  # (cdn depends on chat one-way; chat no longer references cdn → no cycle).
  chat_function_url_host = module.chat.function_url_host
  chat_function_name     = module.chat.function_name
}

module "chat" {
  source = "../modules/chat"

  environment      = var.environment
  bedrock_model_id = var.bedrock_model_id
  lambda_zip_path  = "${path.module}/../../../services/chat/dist/handler.zip"
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
