# Project: jlowe.ai 2.0 ("Velocity")

Rebuild of jlowe.ai into a game-quality 3D explorable journey with a Bedrock-powered AI digital twin. Work proceeds in phases. **Current phase: 1** — the 3D rendering foundation (renderer, scene framework, asset pipeline, loader, fixture) layered over the Phase 0 2D shell.

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

## 3D / world (Phase 1)

- **Import three from `three/webgpu`** (the WebGPURenderer + NodeMaterials) and TSL nodes from `three/tsl` — never bare `three` in world code, or you get class-identity mismatches. Verify WebGPU API names against the installed build, not docs (r184 uses `RenderPipeline`, not `PostProcessing`).
- **One renderer, both tiers**: `WebGPURenderer`; the `webgl` tier just passes `forceWebGL: true` (`lib/renderer.ts`). Tier comes from `lib/capabilities.ts`; `2d` never mounts the canvas. `await renderer.init()` before first frame.
- **One TSL post-FX chain** (`core/post-fx.tsx`) runs on both backends — don't add the `postprocessing` npm lib.
- **Everything 3D stays lazy**: three/fiber/drei/rapier/leva live behind the `next/dynamic(ssr:false)` boundary in `components/world/world-experience.tsx`, so they never enter a flat route's first-load. The bundle-budget gate enforces this (flat ≤225 KB gz; 3D payload ≤8 MB).
- **Dev overlays**: `?debug=1` shows the perf overlay (FPS/draw calls via `gl.info`) + leva panel.
- **Asset pipeline** (`packages/asset-pipeline`): `pnpm --filter @velocity/asset-pipeline assets` builds `raw-assets/` → hashed `apps/web/public/assets/`. KTX2 needs `brew install ktx`; geometry (Draco/Meshopt) is pure-npm.
- **Runtime 3D isn't CI-verifiable** (no GPU headless) — build/typecheck prove compilation; open `/world?debug=1` in a real browser to confirm physics, bloom, and 60fps.
