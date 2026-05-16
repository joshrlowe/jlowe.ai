# Background jobs (Inngest)

Inngest is the platform for async work in jlowe.ai. Functions are
co-located in this directory and registered by the serve handler at
`pages/api/inngest.ts`.

## Files

- `client.ts` — typed Inngest client.
- `events.ts` — `Events` union: every event the system emits.
- `regenerate-embeddings.ts` — keeps `KnowledgeChunk` rows in sync with
  content changes. Triggered by `content/*` events from the admin API
  routes and by `knowledge/reindex.requested` (manual reindex).

## Adding a new function

1. Create the function file next to the others.
2. Import it in `pages/api/inngest.ts` and add it to the `functions: [...]`
   array.
3. If the function reacts to a new event, add it to `events.ts` first so
   emitters get type checking.

## Local development

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run jobs:dev
```

Dashboard at <http://localhost:8288>.

The client tolerates a missing `INNGEST_EVENT_KEY` in dev — events are
sent to the local dev server. Admin API routes wrap `inngest.send` in
try/catch so a missing key (or a transient outage) never breaks an HTTP
request; the failure logs a warn and the request still returns its
normal status.

## Production deployment

1. Set the Inngest env vars in Vercel (or whichever host):
   - `INNGEST_EVENT_KEY` — used by `inngest.send()` to publish events.
   - `INNGEST_SIGNING_KEY` — used by the serve handler to verify
     incoming requests from Inngest.
2. In the Inngest Cloud dashboard, configure the app's webhook URL to
   `https://<your-host>/api/inngest`. Inngest auto-discovers the
   registered functions from the serve handler — no `vercel.json` or
   route changes are needed beyond the env vars.
3. (Optional) configure environment splits in Inngest Cloud so the
   staging deploy uses a separate event/signing key pair.

## Cron note

The lead-funnel digest at `pages/api/cron/qualified-leads-digest.ts`
intentionally stays on Vercel Cron rather than moving to Inngest. It's
a self-contained, time-triggered job that doesn't benefit from
Inngest's event-driven model. Migrate it only if Vercel Cron's
limitations bite.
