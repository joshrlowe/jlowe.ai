locals {
  bucket_name = "jlowe-ai-site-${var.environment}"
  logs_bucket = "jlowe-ai-cdn-logs-${var.environment}"
}

data "aws_caller_identity" "current" {}

# --- Private origin bucket --------------------------------------------------
resource "aws_s3_bucket" "site" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    id     = "expire-noncurrent"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30 # cheap undo for a bad `sync --delete`
    }
  }
}

# --- Origin Access Control + bucket policy ----------------------------------
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "jlowe-ai-${var.environment}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# OAC for the chat Lambda Function URL — only this distribution (SigV4-signed)
# can invoke it, so the Function URL is never publicly reachable.
resource "aws_cloudfront_origin_access_control" "chat" {
  name                              = "jlowe-ai-${var.environment}-chat-oac"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "bucket" {
  statement {
    sid       = "AllowCloudFrontRead"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.bucket.json
}

# --- Caching ----------------------------------------------------------------
# Hashed assets: honor the immutable Cache-Control the deploy sets at sync time.
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

# /api/chat*: never cache (it streams), and forward the POST body + viewer
# headers while letting CloudFront set the origin Host (Function URLs reject a
# mismatched Host).
data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# HTML + everything else: revalidate against the origin (origin sends no-cache).
resource "aws_cloudfront_cache_policy" "html" {
  name        = "jlowe-ai-${var.environment}-html"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 31536000
  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# --- Security headers -------------------------------------------------------
resource "aws_cloudfront_response_headers_policy" "site" {
  name = "jlowe-ai-${var.environment}-headers"

  security_headers_config {
    content_security_policy {
      override = true
      # 'unsafe-inline' on script-src is the pragmatic floor for static-export;
      # 'wasm-unsafe-eval' lets the 3D world instantiate its WebAssembly (rapier
      # physics, three) without permitting general eval().
      # Next (inline bootstrap, no server to mint nonces). Hash-tightening is a
      # later-phase TODO.
      # `blob:` is required by the 3D loaders: DRACOLoader runs its decoder in a
      # blob-URL Web Worker (worker-src — set explicitly so script-src stays
      # tight for general scripts), and GLTFLoader materialises GLB-embedded
      # textures as blob: object URLs it fetches / loads as images (connect-src,
      # img-src). Every blob: URL is same-origin and app-generated.
      content_security_policy = join(" ", [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';",
        "worker-src 'self' blob:;",
        "style-src 'self' 'unsafe-inline';",
        "img-src 'self' data: blob:;",
        "font-src 'self' data:;",
        "connect-src 'self' blob:;",
        "object-src 'none';",
        "base-uri 'self';",
        "form-action 'self';",
        "frame-ancestors 'none';",
        "upgrade-insecure-requests",
      ])
    }
    strict_transport_security {
      override                   = true
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = false # flip + submit to hstspreload.org at prod cutover
    }
    content_type_options {
      override = true
    }
    frame_options {
      override     = true
      frame_option = "DENY"
    }
    referrer_policy {
      override        = true
      referrer_policy = "strict-origin-when-cross-origin"
    }
  }

  custom_headers_config {
    # Permissions-Policy has no first-class field.
    items {
      header   = "Permissions-Policy"
      override = true
      value    = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
    }
    # dev-only noindex.
    dynamic "items" {
      for_each = var.robots_noindex ? [1] : []
      content {
        header   = "X-Robots-Tag"
        override = true
        value    = "noindex, nofollow"
      }
    }
  }
}

# --- URL-rewrite function ---------------------------------------------------
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "jlowe-ai-${var.environment}-url-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = file("${path.module}/functions/url-rewrite.js")
}

# --- ACM certificate (gated on delegation) ----------------------------------
resource "aws_acm_certificate" "site" {
  count             = var.dns_delegated ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.dns_delegated ? {
    for o in aws_acm_certificate.site[0].domain_validation_options : o.domain_name => {
      name   = o.resource_record_name
      type   = o.resource_record_type
      record = o.resource_record_value
    }
  } : {}

  zone_id         = var.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  count                   = var.dns_delegated ? 1 : 0
  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# --- Distribution -----------------------------------------------------------
resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  default_root_object = "index.html"
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  price_class         = var.price_class
  aliases             = var.dns_delegated ? [var.domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-${local.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  origin {
    domain_name              = var.chat_function_url_host
    origin_id                = "lambda-chat-${var.environment}"
    origin_access_control_id = aws_cloudfront_origin_access_control.chat.id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id           = "s3-${local.bucket_name}"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.html.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }

  ordered_cache_behavior {
    path_pattern               = "/_next/static/*"
    target_origin_id           = "s3-${local.bucket_name}"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id
  }

  ordered_cache_behavior {
    path_pattern               = "/assets/*"
    target_origin_id           = "s3-${local.bucket_name}"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id
  }

  # Streaming chat → the Lambda Function URL origin. Same-origin (so CSP
  # connect-src 'self' covers it), no caching, no compression (don't buffer the
  # token stream). The url-rewrite function stays on the default behavior only,
  # so /api/chat is never rewritten to append index.html.
  ordered_cache_behavior {
    path_pattern               = "/api/chat*"
    target_origin_id           = "lambda-chat-${var.environment}"
    viewer_protocol_policy     = "https-only"
    allowed_methods            = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = false
    cache_policy_id            = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id
  }

  # An OAC'd private bucket returns 403 for missing keys (CloudFront has no
  # s3:ListBucket), so we normally map that to the exported 404 page.
  #
  # BUT this remap is distribution-wide, so it also swallows the chat Lambda
  # origin's 403s (OAC/Function-URL signing failures) and serves /404.html from
  # S3 — which is exactly why `POST /api/chat` looks like an S3 404. Gating the
  # 403 remap on `mask_origin_403_as_404` lets an environment (dev) turn it OFF
  # so the *true* origin status reaches the viewer and the access logs
  # (sc-status = 403), while prod keeps the friendly S3 404 page. See the module
  # README / PR for the tradeoff: with it off, a genuinely missing S3 key also
  # surfaces a raw 403 instead of /404.html — acceptable on the noindex'd dev
  # host, not on prod.
  dynamic "custom_error_response" {
    for_each = var.mask_origin_403_as_404 ? [1] : []
    content {
      error_code         = 403
      response_code      = 404
      response_page_path = "/404.html"
      # No error caching: a cached 403 would keep masking the live status while
      # the maintainer is actively debugging the OAC handshake.
      error_caching_min_ttl = 0
    }
  }
  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.dns_delegated ? null : true
    acm_certificate_arn            = var.dns_delegated ? aws_acm_certificate_validation.site[0].certificate_arn : null
    ssl_support_method             = var.dns_delegated ? "sni-only" : null
    minimum_protocol_version       = var.dns_delegated ? "TLSv1.2_2021" : null
  }
}

# Let this distribution (and only it, via the OAC SigV4 signature) invoke the
# chat Function URL. Defined here, not in the chat module, so it references the
# local distribution ARN without a cdn↔chat dependency cycle.
resource "aws_lambda_permission" "chat_invoke_url" {
  statement_id           = "AllowCloudFrontInvokeChatUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = var.chat_function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.site.arn
  function_url_auth_type = "AWS_IAM"
}

# --- Access logging ---------------------------------------------------------
# CloudFront *standard logging v2* (the CloudWatch log-delivery pipeline), not
# the legacy `logging_config` block. v2 delivers to an S3 bucket that keeps
# `BucketOwnerEnforced` (ACLs disabled) — consistent with the site bucket's
# security posture — whereas legacy logging requires re-enabling bucket ACLs.
# These logs record the real per-request `sc-status` + `x-edge-result-type`, so
# a `/api/chat` 403 is visible even while the 403→404 remap is still masking it
# for the S3 site paths.
resource "aws_s3_bucket" "logs" {
  bucket = local.logs_bucket
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "expire-logs"
    status = "Enabled"
    filter {}
    expiration {
      days = 90 # access logs are a debugging aid, not an archive
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Let the CloudWatch Logs delivery service write vended CloudFront logs here.
# Scoped to this account's delivery sources; no ACL header is required because
# the bucket is BucketOwnerEnforced.
data "aws_iam_policy_document" "logs" {
  statement {
    sid       = "AWSLogDeliveryWrite"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:delivery-source:*"]
    }
  }
  statement {
    sid       = "AWSLogDeliveryAclCheck"
    effect    = "Allow"
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.logs.arn]
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:delivery-source:*"]
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.logs.json
}

# Standard logging v2 wiring: source (the distribution's ACCESS_LOGS) →
# destination (the log bucket) → delivery (binds them, sets the S3 layout).
resource "aws_cloudwatch_log_delivery_source" "cf_access" {
  name         = "jlowe-ai-${var.environment}-cf-access-logs"
  log_type     = "ACCESS_LOGS"
  resource_arn = aws_cloudfront_distribution.site.arn
}

resource "aws_cloudwatch_log_delivery_destination" "cf_access_s3" {
  name          = "jlowe-ai-${var.environment}-cf-access-logs-s3"
  output_format = "json"

  delivery_destination_configuration {
    destination_resource_arn = aws_s3_bucket.logs.arn
  }
}

resource "aws_cloudwatch_log_delivery" "cf_access" {
  delivery_source_name     = aws_cloudwatch_log_delivery_source.cf_access.name
  delivery_destination_arn = aws_cloudwatch_log_delivery_destination.cf_access_s3.arn

  s3_delivery_configuration {
    suffix_path                 = "cloudfront/{DistributionId}/{yyyy}/{MM}/{dd}/{HH}"
    enable_hive_compatible_path = false
  }

  depends_on = [aws_s3_bucket_policy.logs]
}

# --- Alias records (gated on delegation) ------------------------------------
resource "aws_route53_record" "alias" {
  for_each = var.dns_delegated ? toset(["A", "AAAA"]) : toset([])
  zone_id  = var.zone_id
  name     = var.domain_name
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
