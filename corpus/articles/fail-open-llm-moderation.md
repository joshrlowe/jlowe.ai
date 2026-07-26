---
slug: fail-open-llm-moderation
title: Fail-open LLM moderation
kind: article
# DRAFT — Claude-drafted from the codebase 2026-07; voice-edit before publishing.
# --- Body grounded strictly in the real moderation system: lib/moderation/
# --- policy.ts (decide()), comment.ts (scoreComment + the 5s timeout race),
# --- types.ts (ModerationError kinds), pages/api/comments/index.ts (the
# --- fail-open-to-held wiring + the mirrored `approved` boolean), and the v2
# --- chat service's fail-open handler (services/chat/src/handler.ts).
# --- TODO markers stay as frontmatter comments so they never enter the twin's
# --- ingested grounding (scripts/build-chat-prompt.mjs).
# TODO(josh): keep every claim to your actual moderation work; add no invented
#             metrics, dates, or outcomes when you voice-edit.
# TODO(josh): once there are a few hundred real submissions, consider adding the
#             true hold / false-positive rate (the README's tuning query) rather
#             than leaving the outcome unquantified — do not estimate it here.
visibility: public
---

Production AI earns trust through its failure modes, not its happy path. The
comment moderation on my blog is a small system with one strong opinion baked
into it: when the infrastructure fails, a legitimate comment must never be
silently rejected. It gets held for a human instead. Fail-open, not fail-closed.

Every comment is scored by Claude Haiku on Bedrock across four axes — spam,
toxicity, off-topic, and PII — each a number between 0 and 1, plus a one-line
summary. The score comes back through forced tool use: invokeJsonTool hands the
model a single report_scores tool with a strict input schema, so instead of
parsing prose I get typed, validated fields. scoreComment races that Bedrock call
against a five-second timeout and then checks the shape of what came back;
anything missing, non-numeric, or out of the 0-to-1 range is thrown out as
malformed.

The routing itself is a pure function, decide, that takes the four scores and
returns approved, held, or rejected. Its asymmetry is the whole point. Only the
three abuse axes — spam, toxicity, PII — can trigger a rejection, and only at high
confidence, at or above 0.8. The same axes in a moderate band, at or above 0.4,
merely hold. Off-topic is softer still: it can only ever hold, never reject, and
only once it clears 0.7, because a tangential comment on a personal blog is not an
offense. Rejection is the narrow, high-confidence action; holding is the wide net
for everything uncertain.

That narrowness is what makes fail-open safe. In the comments API route the
moderation result is initialised — before the model is ever called — to held,
with null scores and the model recorded literally as "error". The Bedrock call
sits inside a try block that only ever overwrites those defaults with a real
decision on success. scoreComment throws a tagged ModerationError on any failure:
a timeout, a Bedrock outage, malformed JSON, or the model not being enabled in the
region. The catch logs it and changes nothing. The comment stays held. There is
no code path in which an infrastructure failure produces a rejection. As the
module itself puts it: holds are reviewable; rejects and approves are not.

Held comments surface in an admin queue where I approve or reject them by hand,
and that action writes an audit-log row. The failure mode, in other words,
degrades to human review — the oldest and most reliable moderation system there
is — rather than to a wrong automated verdict. A false hold costs me a few minutes
of attention. A false reject costs a real person their contribution, silently,
with no way to appeal, because they never learn it happened.

On write, the decision lands in a moderationStatus column, and the legacy approved
boolean is mirrored beside it — approved is set to exactly whether moderationStatus
equals "approved" — so older queries keep working while new public reads filter on
the newer column. The client is never told which bucket its comment fell into:
approved comments simply appear on the next load, and the poster sees the same
friendly confirmation either way. There is no signal a spammer could use to tune
against the classifier, and no accusatory message shown to someone who was merely
held by a hiccup.

Fail-open is not a universal default — it is the right default here because of the
cost of being wrong. For authentication or payments, ambiguity should fail closed:
deny by default, because a wrong "yes" is the expensive mistake. Comment
moderation inverts that. The expensive mistake is a wrong "no" against a genuine
contributor, and the safe fallback — hold for review — is cheap, reversible, and
visible to an operator. Choosing fail-open means deciding, deliberately and in
advance, which error you would rather make when the system is degraded. Fail-closed
moderation that rejects on a Bedrock timeout is choosing to punish your users for
your own outage.

The same instinct runs through the rest of the stack. The rate limiter fails open
when its backing store is unreachable, so a dependency outage never locks real
users out. Observability is wrapped so that a telemetry error can never break the
request it was only meant to watch. And the digital-twin chat that answers
questions on this site is built the same way: its handler wraps the entire
streamed response so that any error ends the stream cleanly with a short apology
instead of hanging a spinner forever. None of this is glamorous. It is just the
set of boring decisions that determine whether people can trust the thing on the
day it is having a bad one.
