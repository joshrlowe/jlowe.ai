# modules/waf — edge WAFv2 Web ACL for the CloudFront distribution.
#
# scope = CLOUDFRONT, so this Web ACL MUST live in us-east-1. The envs stack's
# single provider is already us-east-1 (see envs/versions.tf), so no provider
# alias is needed here — but this module is only valid when instantiated from a
# us-east-1 provider.
#
# Rule evaluation order (lowest priority number first):
#   0  rate-limit-api-chat  — rate-based, scoped to /api/chat* (the primary
#                             motivation: /api/chat is pay-per-token Bedrock, so
#                             a hot loop from one IP is a direct cost-DoS). Always
#                             BLOCK, in every env — this is a cost guardrail, not
#                             a content filter, and 1000 req / 5 min per IP is far
#                             above any legitimate human usage.
#   10 ip-reputation        — AmazonIpReputationList (known malicious sources).
#   20 common               — AWSManagedRulesCommonRuleSet (OWASP-ish baseline).
#   30 known-bad-inputs     — AWSManagedRulesKnownBadInputsRuleSet.
#
# Env-aware managed rules: dev runs the three AWS managed groups in COUNT mode
# (override_action = count) so we observe what they *would* block without risking
# false positives against a site under active development; prod runs them live
# (override_action = none, group's own block actions apply). Toggle via
# var.managed_rules_count_only. The rate-based rule ignores this toggle — it
# blocks everywhere.

locals {
  name_prefix = "jlowe-ai-${var.environment}"

  # AWS managed rule groups run in COUNT mode when count-only is set (dev),
  # otherwise their native actions apply (prod). Expressed as the set of
  # override_action blocks to enable via for_each.
  managed_override_none  = var.managed_rules_count_only ? [] : [1]
  managed_override_count = var.managed_rules_count_only ? [1] : []
}

resource "aws_wafv2_web_acl" "this" {
  name        = local.name_prefix
  description = "Edge WAF for the ${var.environment} CloudFront distribution - managed rules + per-IP rate limit on /api/chat"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # --- 0: rate limit /api/chat* (per-IP cost guardrail) ---------------------
  rule {
    name     = "rate-limit-api-chat"
    priority = 0

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit                 = var.rate_limit
        aggregate_key_type    = "IP"
        evaluation_window_sec = 300 # 5 minutes

        # Only requests to /api/chat* count toward the per-IP limit — the rest
        # of the site (static assets served from S3) is not rate-limited.
        scope_down_statement {
          byte_match_statement {
            search_string         = "/api/chat"
            positional_constraint = "STARTS_WITH"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit-api-chat"
      sampled_requests_enabled   = true
    }
  }

  # --- 10: Amazon IP reputation list ----------------------------------------
  rule {
    name     = "ip-reputation"
    priority = 10

    override_action {
      dynamic "none" {
        for_each = local.managed_override_none
        content {}
      }
      dynamic "count" {
        for_each = local.managed_override_count
        content {}
      }
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesAmazonIpReputationList"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  # --- 20: AWS common rule set ----------------------------------------------
  rule {
    name     = "common"
    priority = 20

    override_action {
      dynamic "none" {
        for_each = local.managed_override_none
        content {}
      }
      dynamic "count" {
        for_each = local.managed_override_count
        content {}
      }
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-common"
      sampled_requests_enabled   = true
    }
  }

  # --- 30: known bad inputs --------------------------------------------------
  rule {
    name     = "known-bad-inputs"
    priority = 30

    override_action {
      dynamic "none" {
        for_each = local.managed_override_none
        content {}
      }
      dynamic "count" {
        for_each = local.managed_override_count
        content {}
      }
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # Web-ACL-level metrics (aggregate across all rules).
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-web-acl"
    sampled_requests_enabled   = true
  }
}
