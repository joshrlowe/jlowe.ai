---
slug: progressive-enhancement-for-3d-sites
title: Progressive enhancement for 3D sites
kind: article
# --- DRAFT STUB. The body below is a grounded abstract only (every claim is
# --- true of this repo today); it is NOT the finished article. TODO markers are
# --- frontmatter comments because the body is ingested into the digital twin's
# --- system prompt — a "TODO" line in the prose would pollute its grounding.
# TODO(josh): draft the full article — the two paragraphs below are the abstract.
# TODO(josh): the corpus schema has no date/reading-time field, so no publish
#             date renders. Decide whether to add one (schema change) or leave
#             articles undated before publishing.
visibility: public
---

This site renders three ways from a single codebase: a WebGPU path for the full
3D experience, a WebGL2 fallback for machines that can't do WebGPU, and a 2D
shell — the page you're reading now — that search engines and screen readers
understand completely. Capability detection picks the tier, and one renderer
drives both GPU backends.

Progressive enhancement isn't an afterthought here, it's the contract: no
feature ships if it breaks a lower tier, and the 2D surface stays the canonical,
accessible source of truth. This piece walks through how the tiers are detected
and why the accessible surface has to come first.
