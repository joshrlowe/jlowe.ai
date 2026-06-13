# Project: jlowe.ai 2.0 ("Velocity")

Rebuild of jlowe.ai into a game-quality 3D explorable journey with a Bedrock-powered AI digital twin. Work proceeds in phases. **Current phase: 0** — monorepo scaffold, 2D shell, infra, CI. No 3D work yet.

> The live v1 site still deploys from `main` via Vercel. All Velocity work targets the long-lived `v2` integration branch; never break `main` until the cutover phase.

## Standing rules

- Monorepo: `apps/web` (Next.js App Router, strict TS), `packages/asset-pipeline`, `services/chat` (Lambda, TS), `infra/terraform`, `corpus/`.
- TypeScript strict; no `any`; ESLint + Prettier enforced in CI.
- 3D: React Three Fiber + drei + three/webgpu + TSL. Physics: @react-three/rapier. State: zustand + a chapter finite-state machine. (Later phases — nothing 3D ships in Phase 0.)
- **Progressive enhancement is sacred**: WebGPU → WebGL2 fallback → 2D shadcn/ui mode. The 2D mode is the SEO/accessibility surface. Never ship a feature that breaks a lower tier.
- Performance budgets: first meaningful paint of 2D shell < 1.5s; initial 3D payload (code+assets before interactive) < 8 MB; 60fps target desktop, 30fps mid-range mobile; < 100 draw calls per scene. CI fails if bundle budget is exceeded (`budgets.json` + `scripts/check-bundle-budget.mjs`).
- All AI calls go through our backend (Bedrock via IAM). NEVER put model calls, keys, or prompts in client code beyond display strings.
- Infra is Terraform-only; never create AWS resources by hand or with raw AWS CLI mutations. Local terraform: fmt/validate/plan only. Applies happen in CI (gated GitHub environments). Documented one-time exceptions: `infra/terraform/bootstrap/bootstrap.sh` and the first local apply of the `global` stack (it creates the roles CI assumes).
- Verify external facts before hardcoding: Bedrock model IDs / inference profiles, S3 Vectors regional availability, three.js WebGPU API names. Check docs or run read-only AWS CLI describe/list commands instead of guessing.
- No copyrighted game/film IP: original assets only; the lava world is an original volcanic planet, not any specific franchise location.
- Conventional commits; small PRs per feature (base: `v2`); every PR description lists acceptance checks run.

## Layout

```
apps/web/                 Next 16 App Router, static export (output: 'export')
  src/app/(flat)/         2D portfolio shell — the permanent SEO/a11y surface
  src/app/(world)/        client-only host for the future 3D canvas
  src/lib/capabilities.ts WebGPU/WebGL2/2D tier detection (?mode= override)
packages/asset-pipeline/  future glTF/KTX2/Draco pipeline (stub)
services/chat/            Lambda chat backend (stub; typed handler, esbuild)
infra/terraform/          global/ (zone, CI IAM) + envs/ (dev|prod tfvars) + modules/
corpus/                   digital-twin source content (not a workspace package)
scripts/                  repo tooling (bundle budget gate)
```

## Commands

```bash
corepack enable pnpm        # one-time per machine (pnpm pinned via packageManager)
pnpm install                # root install for all workspaces
pnpm dev                    # apps/web dev server (single terminal, no extra services)
pnpm build                  # all workspaces; apps/web emits static export to apps/web/out
pnpm lint | typecheck | test | format:check
node scripts/check-bundle-budget.mjs   # gzip first-load JS vs budgets.json (after build)
```

## Deploy / infra

- Web deploys: `.github/workflows/deploy-web.yml` (workflow_dispatch env dev|prod) — OIDC role, two-tier `s3 sync` (immutable `_next/static` + `assets/`, no-cache HTML), CloudFront invalidation.
- Terraform: `.github/workflows/terraform.yml` — fmt/validate/plan on PRs touching `infra/**`; applies via dispatch behind `terraform-dev`/`terraform-prod` reviewer gates.
- Static-export constraints: no middleware/ISR/Server Actions/headers()/redirects()/Image optimization. CDN owns headers, 404 mapping, and URL rewrites (`infra/terraform/modules/cdn`).
- dev environment serves at https://dev.jlowe.ai with `X-Robots-Tag: noindex` (header set by the dev CloudFront distribution — app code ships prod-true SEO).
- Full runbook: `infra/terraform/bootstrap/README.md`.
