# Comment Moderation

AI-scored routing for blog comments. Each incoming comment is classified
on four axes by Claude Haiku 4.5 via Bedrock and routed to one of three
buckets: **approved**, **held**, **rejected**.

## Pipeline

```
POST /api/comments
  → existing rate limit
  → existing input validation
  → scoreComment()      (lib/moderation/comment.ts)
  → decide()            (lib/moderation/policy.ts)
  → prisma.comment.create with moderationStatus + mirrored `approved`
  → 201 { id, createdAt }
```

Public reads filter on `moderationStatus = "approved"`. The legacy
`approved` boolean is mirrored on every write so old queries still
work.

Held comments surface in `/admin/comments`. Approving / rejecting them
writes an `ActivityLog` row and flips both `moderationStatus` and
`approved` to keep the columns in sync.

## Thresholds

| Decision | Trigger |
|----------|---------|
| `rejected` | `spam ≥ 0.8` OR `toxicity ≥ 0.8` OR `pii ≥ 0.8` |
| `held` | `spam ≥ 0.4` OR `toxicity ≥ 0.4` OR `pii ≥ 0.4` OR `offTopic ≥ 0.7` |
| `approved` | otherwise |

These are starting points. Off-topic alone is held softer than the
abuse axes (0.7 instead of 0.4) because tangential comments are
usually fine on a personal blog.

## Fail-open semantics

Any of the following → fail-open hold (status=held, model="error",
scores=null):

- Bedrock outage / 5xx / throttle
- Network timeout (5s ceiling)
- Model returns malformed JSON
- Model is not enabled in the region (AccessDeniedException)

The pipeline never auto-rejects or auto-approves on infrastructure
failure. Holds are reviewable; rejects and approves are not.

## Tuning

After a few hundred real submissions, query the raw scores:

```sql
SELECT
  "moderationStatus",
  AVG(("moderationScores"->>'spam')::float)     AS avg_spam,
  AVG(("moderationScores"->>'toxicity')::float) AS avg_tox,
  AVG(("moderationScores"->>'offTopic')::float) AS avg_off,
  AVG(("moderationScores"->>'pii')::float)      AS avg_pii,
  COUNT(*)
FROM comments
WHERE "moderationModel" <> 'error'
GROUP BY "moderationStatus";
```

Cluster the held-but-actually-fine and the held-but-actually-bad
populations and adjust the thresholds in `lib/moderation/policy.ts`.

## Caching

Identical (content, postTopic) submissions inside a 5-minute window
share a score. In-process LRU at 50 entries — no Redis dependency.
Two different commenters posting the same content will reach the
same decision, which is exactly what we want.

## Model

`anthropic.claude-haiku-4-5-20251001-v1:0` on Bedrock. Configured at
`lib/bedrock/client.ts:MODERATION_MODEL_ID`. Requires
`bedrock:InvokeModel` IAM permission and the model to be enabled in
the region's Bedrock model access list.

## Files

- `lib/bedrock/client.ts` — `invokeJsonTool` helper (additive).
- `lib/moderation/types.ts` — `CommentScores`, `ModerationDecision`, `ModerationError`.
- `lib/moderation/cache.ts` — `TtlCache<V>`.
- `lib/moderation/policy.ts` — `decide(scores)`.
- `lib/moderation/comment.ts` — `scoreComment(input, deps?)`.
- `pages/api/comments/index.ts` — wired POST/GET.
- `pages/admin/comments.tsx` — review UI.
- `pages/api/admin/comments/{index,[id]}.ts` — admin API.
