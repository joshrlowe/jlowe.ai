# Architecture

Short map of the Velocity monorepo on `v2`. Deeper rules live in
[`CLAUDE.md`](../CLAUDE.md). Production hosting versus the v1 tree is the
[README](../README.md). Cutover steps stay in the runbooks and are not
repeated here.

## Layout

| Path                      | Role                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                | Public site. Next.js App Router, `output: 'export'`. Flat routes under `src/app/(flat)` are the SEO surface. `src/app/(world)` mounts the 3D canvas on the client only. |
| `corpus/`                 | Authoring source for the digital twin and the flat pages. Markdown + zod-checked frontmatter. Not a workspace package.                                                  |
| `packages/corpus-index`   | Chunks and embeds `corpus/` for retrieval. `pnpm index:check` guards the committed index.                                                                               |
| `services/chat`           | Streaming chat Lambda (Bedrock via the function role). Reads the corpus index. Sessions in DynamoDB.                                                                    |
| `services/contact`        | Contact-form Lambda. Sends through SES v2.                                                                                                                              |
| `packages/asset-pipeline` | Builds `raw-assets/` into hashed files under `apps/web/public/assets/`.                                                                                                 |
| `infra/terraform`         | All AWS resources. `global/` is the zone and CI roles. `envs/` is dev and prod. `modules/` is CDN, chat, contact, WAF, budgets, alarms.                                 |
| `scripts/`                | Corpus codegen, bundle-budget gate, asset guard.                                                                                                                        |
| `tools/cinematic/`        | Local Blender renders. See its README.                                                                                                                                  |

`pnpm-workspace.yaml` includes `apps/*`, `packages/*`, and `services/*`.
`corpus/`, `infra/`, `scripts/`, and `tools/` are outside the workspace on
purpose.

## How a page and a chat reply fit together

1. Authors edit `corpus/**/*.md`.
2. `pnpm corpus` (`scripts/build-corpus.mjs`, `scripts/build-chat-prompt.mjs`)
   writes `apps/web/src/data/corpus.generated.ts` and
   `services/chat/src/system-prompt.ts`. Both are committed. CI diffs them.
3. `pnpm index` / `index:check` refreshes the retrieval index consumed by chat.
4. The flat site imports the generated corpus at build time. There is no
   runtime database and no admin CMS on this branch.
5. The browser posts chat to `/api/chat` on the CloudFront distribution. That
   path is a behavior in `infra/terraform/modules/cdn` in front of the chat
   Function URL. The static export has no Next.js API routes.
6. Every client call to `/api/*` sends `x-amz-content-sha256` (hex SHA-256 of
   the body). CloudFront’s OAC SigV4 signature omits the payload hash without
   it, and the Function URL rejects the request.
7. Contact uses the same pattern against `/api/contact` and
   `services/contact`.

Langfuse keys are SSM parameters named by `LANGFUSE_PUBLIC_KEY_PARAM` and
`LANGFUSE_SECRET_KEY_PARAM`. Cal.com is a booking URL built from
`CALCOM_USERNAME` (empty means the tool stays off). See
[`.env.example`](../.env.example) and `infra/terraform/modules/chat`.

## Tiers

`apps/web/src/lib/capabilities.ts` picks WebGPU, WebGL2, or 2D. The 2D tier
never mounts the canvas. 3D dependencies stay behind `next/dynamic` in
`components/world/world-experience.tsx` so they stay out of the flat-route
bundle. Budgets: `budgets.json` and `scripts/check-bundle-budget.mjs`.

## World ownership

`joshrlowe/jlowe-world` holds the extracted Chapter 1 driving circuit.
`apps/web/src/components/world/` in this repo is the shell that remains: transit
scene, fixture scene, renderer, post-FX, and the chapter state machine with an
empty registry (`state/chapters.ts`). `tools/cinematic/` is the pre-rendered
hero pipeline and stays in this repo.

## Deploy shape

Static files go to S3 in two cache tiers (`deploy-web.yml`): no-cache HTML,
immutable `_next/static` and `assets/`. Lambda code is updated by
`deploy-chat.yml` and `deploy-contact.yml`; Terraform owns the function
configuration. Applies happen in GitHub Actions behind environment reviewers.
Local apply is not the path. Full bootstrap steps:
[`infra/terraform/bootstrap/README.md`](../infra/terraform/bootstrap/README.md).
