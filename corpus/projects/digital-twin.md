---
slug: digital-twin
title: AI digital twin
kind: project
role: AI Engineer
stack: [Claude on Bedrock, AWS Lambda, TypeScript, Zod]
outcomes:
  - Grounded only in a reviewed corpus — the twin declines to invent facts about Josh
  - Fail-open by design — any error still ends the stream cleanly, so the chat never hangs
  - Schema-validated, turn-capped requests bound both the prompt and the Bedrock bill
# --- TODO(josh) markers live here as frontmatter comments on purpose: the body
# --- below is ingested verbatim into the digital twin's system prompt, so a
# --- "TODO" line in the prose would become part of its grounding. Keep the body
# --- clean; track what you still owe here.
# TODO(josh): confirm the role/title label you want shown for this project.
# TODO(josh): the body deliberately claims no numbers — if you want metrics on
#             the project page (launch date, usage, engagement), supply them and
#             add them to `outcomes` above.
visibility: public
---

The site answers questions about Josh in his own words — a digital twin that
speaks _about_ him, never _as_ him. It streams responses from Claude on AWS
Bedrock through a Lambda response stream, grounded in a fixed persona plus the
same public corpus that powers the rest of the site, so the twin and the
portfolio can never drift apart.

The guardrails are the design. The twin answers only from the corpus, declines
to invent employers, dates, or metrics, and points hiring questions to the
contact page. Requests are schema-validated and turn-capped to bound both the
prompt and the Bedrock bill, and every failure path ends the stream with a
friendly line instead of hanging. When a visitor has explored beacons in the 3D
world, what they saw is passed along as a grounding hint.
