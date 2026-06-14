---
slug: reliability
title: Fail-open by design
kind: project
role: Engineer
stack: [Claude on Bedrock, Inngest, PostgreSQL]
outcomes:
  - LLM moderation that holds content for review instead of wrongly rejecting it
  - Every external dependency degrades gracefully, never breaking the request
  - Observability threaded through every span of the pipeline
visibility: public
---

Production AI lives or dies on its failure modes. Moderation that fails open
(hold, don't reject), rate limits that fail open when the limiter is down, and
observability that never propagates its own errors — the boring decisions that
keep a product trustworthy.
