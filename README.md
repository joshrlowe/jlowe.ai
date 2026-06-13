# jlowe.ai 2.0 — "Velocity"

Personal site of Josh Lowe, rebuilt as a game-quality 3D explorable journey with an AI digital twin. pnpm monorepo: Next.js (App Router, static export) 2D shell in `apps/web`, future 3D world layered on top via progressive enhancement (WebGPU → WebGL2 → 2D), AWS infra in `infra/terraform`, chat backend in `services/chat`.

> **Branch model**: the live v1 site deploys from `main` (Vercel). All 2.0 work lands on the `v2` integration branch via small PRs. See `CLAUDE.md` for standing rules.

## Quickstart

```bash
corepack enable pnpm
pnpm install
pnpm dev          # http://localhost:3000
```

`pnpm build` / `pnpm test` / `pnpm lint` / `pnpm typecheck` run across all workspaces.
