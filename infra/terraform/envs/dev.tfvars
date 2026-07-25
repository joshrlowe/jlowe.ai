environment    = "dev"
domain_name    = "dev.jlowe.ai"
dns_delegated  = true # delegated to Route53 — enables dev.jlowe.ai + ACM
robots_noindex = true

# Debug lever: let the chat Lambda origin's real 403 reach the viewer + access
# logs instead of being remapped to the S3 /404.html page. Safe on the
# noindex'd dev host; prod keeps the default (true).
mask_origin_403_as_404 = false
