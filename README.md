# jlowe.ai — Velocity (`v2`)

Personal site of Josh Lowe, rebuilt as a game-quality 3D explorable journey
with a Bedrock-powered AI digital twin. This branch is the **Velocity**
monorepo. The root npm package is named `velocity`; workspace packages are
`@velocity/*`. The GitHub repository and the public hostname stay `jlowe.ai`.

## Production truth

`main` and `v2` are two applications that diverged after an old merge-base
(`cb86323`, 2026-05-15). They are not a normal feature branch of each other.
**Branch collapse is not done.** `origin/main` is still the v1 tree
(`cb45fe4`). Do not merge this tree into `main`, force-push either branch,
flip `CUTOVER_ENABLED`, change DNS, or delete the v1 tree.

Checked with `curl` on 2026-09-28 (re-check before acting on DNS):

| Surface                       | What responded                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://jlowe.ai`            | CloudFront → S3 (`server: AmazonS3`). HTML is the Velocity flat shell (title “Josh Lowe — AI Engineer & Consultant”, “Enter World”). Object `last-modified` 2026-08-24. |
| `https://www.jlowe.ai`        | CloudFront function, `301` → `https://jlowe.ai/`.                                                                                                                       |
| `https://jlowe-ai.vercel.app` | v1 Next.js site (`server: Vercel`, `x-powered-by: Next.js`, `x-robots-tag: noindex`). Title “Josh Lowe - AI/ML Engineer \| Portfolio”.                                  |
| git `main`                    | v1 source (Pages Router, Prisma, Playwright). This is what the Vercel project builds.                                                                                   |
| git `v2`                      | This monorepo. Source for the CloudFront artifact. Not merged into `main`.                                                                                              |

An apex that already serves a Velocity export is **not** permission to finish
cutover. Push-to-`main` deploys in `.github/workflows/deploy-*.yml` and
`terraform.yml` stay gated on `vars.CUTOVER_ENABLED == 'true'`. This repo
does not read or set that variable.

Runbooks (the docs, not the switch):

- [`docs/runbooks/cutover.md`](docs/runbooks/cutover.md) — Stage 4. Its
  “current wiring” table still describes the apex A record as Vercel
  `76.76.21.21`, which does not match the 2026-09-28 response above.
- [`docs/runbooks/stage-5-collapse.md`](docs/runbooks/stage-5-collapse.md) —
  Stage 5, collapsing `v2` into `main`. The 2026-08-24 SHA table is stale
  (`origin/main` is `cb45fe4`, still v1). Do not execute it from a feature PR.
- [`infra/terraform/bootstrap/README.md`](infra/terraform/bootstrap/README.md)
  — how the AWS account, zone, and CI roles were created.

`vercel.json` on this branch skips the Vercel build unless
`VERCEL_GIT_COMMIT_REF` is `main` (Vercel treats exit 1 as “build”). After a
naive merge, that would let the v1 Vercel project build this static export
and replace the rollback origin. Leave the Vercel project alone.

## What lives on which branch

|                 | `main` (v1 source)                                    | `v2` (this tree)                                                                                                         |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| App             | Next.js 15 Pages Router, npm, package name `jlowe.ai` | pnpm workspaces, Next.js 16 App Router static export, package name `velocity`                                            |
| Content / admin | Prisma + Postgres, NextAuth, `/admin` CMS             | Markdown `corpus/` compiled to generated TypeScript. No Prisma, no admin CMS                                             |
| Tests           | Jest, Playwright (`e2e/`)                             | Vitest. Live Bedrock probes behind `RUN_LIVE_EVAL=1`. Playwright is a follow-up                                          |
| AI / contact    | In-process Bedrock, Inngest, Langfuse keys, Resend    | `services/chat` and `services/contact` Lambdas. Langfuse keys in SSM. SES v2                                             |
| Hosting         | Vercel project tracking `main`                        | Terraform (`infra/terraform`) + CloudFront. Deploys are `workflow_dispatch` until cutover is explicitly armed            |
| Repo hygiene    | `.env.example`, MIT `LICENSE`, Dependabot for npm     | `.env.example`, MIT `LICENSE`, Dependabot for the pnpm lockfile, `CODEOWNERS`, plus `LICENSES.md` for asset attributions |

## Workspace map

```
apps/web/                  @velocity/web — Next.js static export
  src/app/(flat)/          2D marketing shell (SEO and accessibility)
  src/app/(world)/         client-only 3D host
packages/asset-pipeline/   @velocity/asset-pipeline — glTF/KTX2/Draco
packages/corpus-index/     @velocity/corpus-index — chunk, embed, retrieve
services/chat/             @velocity/chat — streaming chat Lambda
services/contact/          @velocity/contact — contact-form Lambda (SES)
infra/terraform/           global stack + envs (dev|prod) + modules
corpus/                    digital-twin markdown (not a workspace package)
scripts/                   corpus build, bundle budget, asset guard
tools/cinematic/           local Blender hero pipeline (not CI)
docs/                      architecture + runbooks
```

## Quickstart

Requires Node from `.nvmrc` (24.x) and pnpm via Corepack (`packageManager`
pins the version).

```bash
corepack enable pnpm
pnpm install
pnpm dev          # http://localhost:3000
```

`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, and
`pnpm format:check` run across workspaces. `pnpm corpus` regenerates the
committed corpus artifacts; CI fails if they drift.

Copy [`.env.example`](.env.example) to `.env` only when you need a real
GitHub token or a live eval. The flat site boots with every value empty.
Chat and contact run in AWS, not in `pnpm dev`.

## Branch and deploy model

- Feature PRs target **`v2`**. `main` keeps shipping the v1 Vercel project
  until a human executes the runbooks above.
- Web, chat, and contact deploys: `workflow_dispatch` on
  `.github/workflows/deploy-web.yml`, `deploy-chat.yml`, `deploy-contact.yml`
  (dev or prod, with GitHub environment gates).
- Terraform plan runs on infra PRs; apply is a gated `workflow_dispatch`.
  Local Terraform is fmt / validate / plan only.
- `dev.jlowe.ai` is the Velocity preview host (`X-Robots-Tag: noindex` from
  the dev distribution). App code does not special-case that header.

## World code and `jlowe-world`

The interactive Chapter 1 driving circuit (coastal track, vehicle, hero race)
lives in the sibling repo `joshrlowe/jlowe-world` (named in this tree's world
comments; it is not a directory here). Its asset attributions moved with it
(`LICENSES.md`).

This repo still owns:

- `apps/web/src/components/world/**` — renderer shell (WebGPU with a WebGL2
  fallback), the in-transit starfield, the `?scene=fixture` harness, and the
  chapter FSM / HUD machinery. The chapter registry is empty while Chapter 2
  (“Escape Velocity”) is built. These files are live; they are not a dead copy
  of the extracted circuit.
- `tools/cinematic/**` — headless Blender pipeline for a pre-rendered hero.
  It stays here. It is local-only (never CI) and is not the drivable world.

Do not move those trees across repos in a hygiene PR.

## Further reading

- [`docs/architecture.md`](docs/architecture.md) — how web, chat, contact, and corpus fit together
- [`CLAUDE.md`](CLAUDE.md) — agent-facing standing rules
- [`LICENSES.md`](LICENSES.md) — third-party asset attributions (separate from the MIT `LICENSE`)
