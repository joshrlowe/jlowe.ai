---
slug: progressive-enhancement-for-3d-sites
title: Progressive enhancement for 3D sites
kind: article
# DRAFT — Claude-drafted from the codebase 2026-07; voice-edit before publishing.
# --- Body grounded strictly in this repo: src/lib/capabilities.ts (tier
# --- detection), src/lib/renderer.ts (one WebGPURenderer, forceWebGL), the
# --- (flat) vs (world) route split, world-root.tsx (the runtime degradation
# --- ladder), and scripts/check-bundle-budget.mjs (the budget gate).
# --- TODO markers stay as frontmatter comments because the body is ingested
# --- into the digital twin's system prompt (scripts/build-chat-prompt.mjs) — a
# --- "TODO" line in the prose would pollute its grounding.
# TODO(josh): the corpus schema has no date/reading-time field, so no publish
#             date renders. Decide whether to add one (schema change) or leave
#             articles undated before publishing.
# TODO(josh): drop in real measured numbers before publishing — Lighthouse / Core
#             Web Vitals of the flat shell, the actual gz first-load figure —
#             left out here rather than invented; budgets.json records only the
#             enforced ceilings (flat <= 225 KB gz), not measured results.
visibility: public
---

Most 3D websites treat the fancy version as the product and the fallback as an
apology. I built this one the other way around. The page you are reading now —
plain HTML, styled with shadcn/ui, delivered as a static export — is the real
product. The WebGPU journey layered on top is an enhancement. The rule that
governs the whole codebase follows from that: no enhancement is allowed to break
a tier below it.

The site renders in three modes from one codebase. A WebGPU path drives the full
game-quality world. A WebGL2 path is the fallback for machines that cannot do
WebGPU. And a 2D shell is the surface that search engines and screen readers
understand completely. Which mode you get is decided by detectCapabilityTier in
src/lib/capabilities.ts — a pure function with every browser input injected, so
it is fully unit-testable and safe to run during server rendering.

The detection order is deliberate. An explicit ?mode= override wins first, so
any tier is one query parameter away for testing or for a visitor who just wants
the light version. Then prefers-reduced-motion: if you have asked your operating
system to reduce motion, you go straight to 2D — an accessibility preference
outranks raw capability. Only after that does feature detection run: navigator.gpu
present means WebGPU, a usable WebGL2 context means WebGL, otherwise 2D. Finally a
memory guard drops one tier on devices reporting under 4 GB. During server
rendering there is no browser at all, so the function defaults to 2D — the
accessible surface is what prerenders.

navigator.gpu being present does not guarantee a working GPU, so a second,
asynchronous pass — refineCapabilityTier — actually requests an adapter with a
one-second timeout and quietly steps WebGPU down to WebGL if none arrives.
useCapabilityTier wires this into React through useSyncExternalStore: the server
snapshot is null, detection runs once per session on the client, and the adapter
refinement notifies subscribers only if it changes the answer. No flicker, no
setState-in-effect.

Both 3D tiers share a single renderer. rendererInitForTier maps the tier to
options for three's WebGPURenderer, and the WebGL tier simply passes
forceWebGL: true to drive that renderer's WebGL2 backend. One renderer class, one
post-processing chain, one code path — the fallback is not a separate engine,
just the same engine on a different backend. For the 2D tier the function returns
null, and no canvas mounts at all.

The accessible surface is not a stripped-down copy that drifts out of date. The
(flat) route group is the permanent site: it renders to static HTML, carries the
real metadata, JSON-LD, and Open Graph tags, a skip-to-content link and a lang
attribute, and it is generated from the same corpus that feeds the 3D world and
the AI twin. The (world) route group is a client-only host for the canvas.
Progressive enhancement here means the two share a source of truth — not that one
is a courtesy version of the other.

A rule you cannot enforce is a wish, so the codebase enforces this one three
ways. First, everything 3D — three, react-three-fiber, drei, rapier, leva — lives
in world-experience.tsx, which WorldRoot pulls in through a next/dynamic import
with ssr:false, so none of it can leak into a flat route's first load. Second, a
CI gate makes that measurable: check-bundle-budget.mjs scrapes the emitted HTML in
the static export, sums the gzipped first-load JS referenced by each route, and
fails the build if a flat route crosses 225 KB. The heavy 3D payload has its own
separate budget precisely because it is lazy by definition. Third, the runtime
degrades in the same direction the detector does. WorldRoot wraps the canvas in an
error boundary: a fatal WebGPU init steps down to WebGL2 once by remounting a
fresh canvas, and any further failure redirects to the flat site with a one-time
notice queued through session storage. WebGPU to WebGL2 to 2D, one step at a
time, never a white screen.

The reason to build in this order is that the lowest tier is the contract and the
higher tiers are promises you might not be able to keep. A visitor's browser, GPU,
motion preference, and available memory are not yours to assume. If the accessible
2D surface is the thing that always renders — the thing that prerenders, indexes,
reads aloud, and passes the budget gate — then every enhancement above it is free
to be ambitious, because the code guarantees it can fall all the way back down to
something that works.
