# modules/waf — skeleton (later phase)
#
# Edge WAF for the CloudFront distribution(s).
#
# Planned resources:
#   - aws_wafv2_web_acl (scope = CLOUDFRONT, provider region us-east-1)
#     with AWS managed rule groups (common, known-bad-inputs, rate limiting)
#   - association with the distribution(s)
#
# Planned variables: rate_limit, environment
# Planned outputs:    web_acl_arn
#
# TODO(waf-phase): implement.
