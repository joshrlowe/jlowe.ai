# The jlowe.ai hosted zone. The two records below replicate EXACTLY what lives
# at Namecheap today so the live v1 site keeps resolving to Vercel after the
# one-time nameserver flip. NS/SOA records are created with the zone — never
# declare them here, or delegation can break.

resource "aws_route53_zone" "primary" {
  name = "jlowe.ai"
}

# The apex A (jlowe.ai) moved to the prod `envs` stack (module.cdn CloudFront
# alias) at the 2026-07 cutover. It is removed from config here AND
# `terraform state rm`'d from `global` state (a documented manual step) so the two
# stacks never fight over the record — see docs/runbooks/cutover.md step 4.2b.
# (www_vercel below stays until the www -> apex redirect ships.)

resource "aws_route53_record" "www_vercel" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "www.jlowe.ai"
  type    = "CNAME"
  ttl     = 300
  records = ["cname.vercel-dns.com"]
}
