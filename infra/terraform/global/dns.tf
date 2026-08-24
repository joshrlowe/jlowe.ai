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
#
# www.jlowe.ai followed the apex out of this stack at the 2026-08 redirect
# switch. Its legacy CNAME -> cname.vercel-dns.com is removed from config here
# so a `global` apply DELETEs it, which is the prerequisite for the prod `envs`
# stack to create `module.cdn.aws_route53_record.www_alias` (A/AAAA -> the
# CloudFront distribution that 301s www to the apex).
#
# This ordering is not optional. Route53 resolves CAA by following CNAMEs, so
# while the Vercel CNAME existed, ACM read Vercel's CAA set (globalsign,
# sectigo, letsencrypt, pki.goog -- no amazon.com) for `www.jlowe.ai` and
# failed the SAN with CAA_ERROR, taking the whole prod apply down with it.
# Delete here and apply `global` BEFORE applying `envs` prod.
