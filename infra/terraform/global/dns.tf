# The jlowe.ai hosted zone. The two records below replicate EXACTLY what lives
# at Namecheap today so the live v1 site keeps resolving to Vercel after the
# one-time nameserver flip. NS/SOA records are created with the zone — never
# declare them here, or delegation can break.

resource "aws_route53_zone" "primary" {
  name = "jlowe.ai"
}

resource "aws_route53_record" "apex_vercel" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "jlowe.ai"
  type    = "A"
  ttl     = 300
  records = ["76.76.21.21"]
}

resource "aws_route53_record" "www_vercel" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "www.jlowe.ai"
  type    = "CNAME"
  ttl     = 300
  records = ["cname.vercel-dns.com"]
}
