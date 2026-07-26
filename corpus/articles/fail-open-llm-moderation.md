---
slug: fail-open-llm-moderation
title: Fail-open LLM moderation
kind: article
# --- DRAFT STUB. The body below is a grounded abstract only; it restates
# --- capability already established in the `reliability` corpus entry and the
# --- chat service's fail-open handler — no new specifics. TODO markers are
# --- frontmatter comments so they never enter the twin's ingested grounding.
# TODO(josh): draft the full article — the two paragraphs below are the abstract.
# TODO(josh): keep every claim to your actual moderation work; add no invented
#             metrics, dates, or outcomes when you flesh this out.
visibility: public
---

Production AI earns trust through its failure modes, not its happy path. When a
moderation model times out or a dependency is down, the safe default is to hold
content for review — never to auto-reject a legitimate contribution because the
infrastructure blinked.

It's the same fail-open principle the site's own digital-twin chat runs on:
every error ends the response cleanly instead of hanging, rate limits fail open
when the limiter is unavailable, and observability never propagates its own
errors. This piece is about where fail-open is the right default — and where it
isn't.
