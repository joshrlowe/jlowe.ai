# Certificate address migration.
#
# aws_acm_certificate.site used to be `count`-based, so existing state holds it
# at index 0. It is now keyed on var.cert_serial (see the comment above the
# resource in main.tf). Adopting the existing object as serial 1 keeps the
# switch to the keyed form a no-op for any environment still on the default
# serial -- without this, every environment would needlessly re-issue its
# certificate just because the resource address changed. Only a real serial
# bump re-issues.
moved {
  from = aws_acm_certificate.site[0]
  to   = aws_acm_certificate.site["1"]
}
