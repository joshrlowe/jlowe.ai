locals {
  bucket_name = "jlowe-ai-site-${var.environment}"
}

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
      content_security_policy = join(" ", [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';",
        "style-src 'self' 'unsafe-inline';",
        "img-src 'self' data:;",
        "font-src 'self' data:;",
        "connect-src 'self';",
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

  # An OAC'd private bucket returns 403 for missing keys (CloudFront has no
  # s3:ListBucket), so map both to the exported 404 page.
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }
  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
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
