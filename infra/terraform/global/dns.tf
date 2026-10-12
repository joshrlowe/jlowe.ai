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

# ACME DNS-01 challenges so Vercel can issue the jlowe.ai + www.jlowe.ai
# certificate BEFORE the prod `envs` apply points both names back at Vercel
# (#196). Vercel's last certificate expired while DNS pointed at CloudFront,
# and HTTP-01 can't pass until the A records move, so without these the switch
# would serve certificate errors until a re-issue. Values come from
# `vercel certs issue --challenge-only jlowe.ai www.jlowe.ai`; finish with
# `vercel certs issue jlowe.ai www.jlowe.ai`. Vercel renews over HTTP-01 once
# the A records point at it, so delete these after the switch.
resource "aws_route53_record" "vercel_acme_challenge" {
  for_each = {
    "_acme-challenge.jlowe.ai"     = "t5etiGnDnQWAxHVfcYo-PTZaIT-WW57mTdNcK2OCbzA"
    "_acme-challenge.www.jlowe.ai" = "P416LjbrsP_JkT_xcFw_cwIA-3vUHNh4uHw04SeLZrw"
  }

  zone_id = aws_route53_zone.primary.zone_id
  name    = each.key
  type    = "TXT"
  ttl     = 60
  records = [each.value]
}
