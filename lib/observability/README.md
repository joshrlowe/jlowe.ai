# Chat observability (Langfuse)

This module pipes the `/api/chat` RAG path through [Langfuse](https://langfuse.com) so we can:

- Inspect every chat session — what was asked, what was retrieved, what the model returned, latency, token counts.
- Group multi-turn conversations into a single session via the `chat_session_id` cookie.
- Capture thumbs-up / thumbs-down feedback against the same trace.

It is **fail-open**: if `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` are missing, all observability becomes a no-op and chat behaves exactly as before.

## Setup

1. Sign up at [langfuse.com](https://langfuse.com) and create a project.
2. **Project settings → API Keys → Create new API keys.** Copy the public + secret values.
3. Add to `.env.local`:
   ```
   LANGFUSE_PUBLIC_KEY=pk-lf-…
   LANGFUSE_SECRET_KEY=sk-lf-…
   # Optional — defaults to https://cloud.langfuse.com
   LANGFUSE_HOST=https://cloud.langfuse.com
   ```
4. Restart the dev server. Open the chat widget (bottom-right floating button), send a message, then check the Langfuse dashboard — the trace should appear within ~30 seconds.

## Trace structure

Each `/api/chat` request becomes one trace with three child observations:

```
trace: chat
├── span: rate-limit         (input: keyPrefix; output: { allowed })
├── span: retrieval          (input: { query, topK }; output: { chunkIds, titles, scores })
└── generation: claude-3-5-sonnet
    ├── input: { systemPrompt, messages }
    ├── modelParameters: { maxTokens, temperature }
    ├── usage: { input, output }
    ├── metadata.timeToFirstTokenMs
    └── output: full assistant response text
```

Trace-level metadata: `ipHash` (SHA-256 truncated to 16 hex), `userAgent`, `latencyMs`, `status` (`ok` / `bad_request` / `rate_limited` / `error`). The trace is bound to a `sessionId` matching the `chat_session_id` cookie, so multiple chat turns from the same browser show up under one Session in Langfuse.

## User feedback

The frontend calls `POST /api/chat/feedback` with the trace ID it captured from the `x-trace-id` response header:

```json
{ "traceId": "…", "score": 1, "comment": "optional, max 1000 chars" }
```

Score `1` = thumbs up, `-1` = thumbs down. The score is attached to the trace under the name `user_feedback`. Endpoint is rate-limited to 5/min/IP via `checkRateLimit`.

## Common queries

In the Langfuse dashboard:

- **Negative feedback in last 7 days**: Traces tab → filter `Scores → user_feedback < 0`, time range `Last 7 days`. Click any trace to see the prompt, the retrieved chunks, and the response side by side.
- **Slow responses**: Traces tab → sort by `Latency` descending. Look at the generation observation's `timeToFirstTokenMs` to distinguish slow retrieval from slow generation.
- **Multi-turn conversations**: Sessions tab → click any session ID. All turns from one browser appear in chronological order.
- **Cost analysis**: Traces tab → toggle the `Cost` column. Generation observations have `usage.input` / `usage.output` token counts that Langfuse multiplies by the model's pricing.

## Privacy

- IPs are SHA-256 hashed and truncated to 16 hex chars before logging — clusters per-client without storing raw addresses.
- The `chat_session_id` cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production. Client JS cannot read it; only the server-side trace links use it.
- No other PII is collected beyond what users type into the chat.

## Disabling

Remove `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` from `.env.local` and restart. Chat continues to work; the `x-trace-id` response header simply won't be set, and feedback POSTs return 204 without forwarding anywhere.

## How it's wired

| File | Role |
|---|---|
| `lib/observability/langfuse.ts` | Lazy-imported singleton + `startTrace()` / `scoreTrace()` helpers |
| `lib/observability/session.ts` | UUIDv4 session cookie (`chat_session_id`) management |
| `lib/observability/ip.ts` | Shared `getClientIp()` (also used by rate limiter) and `hashIp()` |
| `pages/api/chat.ts` | Creates the trace, wraps rate-limit/retrieval/generation in spans |
| `pages/api/chat/feedback.ts` | Validates feedback and calls `scoreTrace()` |
| `lib/bedrock/client.ts` | Surfaces `onFirstToken` and `onUsage` callbacks parsed from Bedrock stream events |
| `components/Chat/` | Floating widget UI; reads `x-trace-id` and posts feedback |
