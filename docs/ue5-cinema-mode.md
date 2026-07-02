# UE5 Cinema Mode — the pixel-streamed F1-quality hero

**Status:** spec. Blocked on: Vagon account (user), UE editor build (user, following
this doc), then the web embed (Claude, `feat/world-cinema-mode`).

## What this is

An opt-in, **literally-F1-25-class** version of the `?scene=hero` night race,
built in Unreal Engine 5 (Lumen GI, ray-traced reflections, Niagara), rendered
on Vagon Streams' cloud GPUs, and delivered to the browser as WebRTC video.
It layers ON TOP of the three.js hero — never replaces it:

```
"Enter cinema mode" button (hero scene, all tiers)
  → Vagon stream session (when a slot is free + under the monthly cap)
  → falls back to the three.js WebGPU/WebGL hero (the always-on default)
  → 2D tier never sees the button
```

Why opt-in: streaming bills **per visitor-minute of GPU time**. Auto-playing a
stream for every visitor would turn a traffic spike into a bill or a queue.
The three.js hero stays the first impression; cinema mode is the flex.

## Division of labor

| Who        | What                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User**   | Vagon account + spend cap; buy Fab assets; assemble the UE scene in-editor per §3–§5; package + upload builds                                                |
| **Claude** | This spec; the web embed (button → iframe + Streams JS SDK → fallback chain, feature-flagged); budget monitoring hooks; iteration notes per feel-check round |

## 1. Accounts & costs (researched 2026-07)

- **Vagon Streams** — pay-as-you-go, no subscription floor:
  $0.025–0.047/min by GPU tier (Tesla T4 → A10G → L4 with DLSS 3) plus
  ~$0.67/day/region app maintenance. Free trial exists. Start on **L4
  (DLSS-capable)**; drop to T4 if the scene holds 60 fps there.
  Docs: <https://docs.vagon.io/streams/unreal-engine-pixel-streaming>
- Realistic spend at ~1k visitors/mo with ~15% clicking cinema mode for ~3 min:
  **$30–45/mo**. Suggested initial cap: **$50/mo** (dashboard budget control).

## 2. UE project setup (user, ~30 min)

1. Epic Games Launcher → install **UE 5.6+** (Vagon supports 5.x; their system
   auto-detects the version and configures WebRTC/TURN — no signalling infra on
   our side).
2. New project: **Games → Blank**, C++ not required (Blueprint-only is fine),
   Target: **Desktop / Maximum quality**, no starter content.
3. Plugins: enable **Pixel Streaming**. Project Settings:
   - Platforms → Windows: default RHI **DirectX 12**.
   - Rendering: **Lumen** GI + reflections (Software Lumen is fine; Hardware RT
     if the L4 tier proves it), Virtual Shadow Maps, TSR at 1080p output.
   - Frame rate: cap **60 fps** (streams encode at the app frame rate).
4. Name it `VelocityCinema`. Keep the project OUT of the jlowe.ai repo (UE
   projects are multi-GB binary; the repo only carries this spec + the embed).

## 3. Fab shopping list (user; budget ~$50–200 one-time)

License note: Fab Standard License covers interactive products including
streamed apps — record each purchase + listing URL in `LICENSES.md` under a
new "UE5 cinema mode" section. **No real F1 team/sponsor/circuit marks** — the
repo's no-real-brand-IP rule applies in UE too; pick generic open-wheelers and
strip any real logos from liveries.

Candidates found (verify current price/quality, prefer 4.26+ ratings):

- **Open-wheel car** (the critical buy): search Fab for "formula race car" /
  "open wheel race car". Requirements: separate wheel meshes (they must spin),
  4K PBR (carbon weave, metallic paint w/ clearcoat), a halo, LODs optional
  (one hero car, 5 instances). The "Race Course Pack" and "Race Car Bundle"
  families are fallbacks if no good formula car exists — a modern LMP/GT
  silhouette also reads "race broadcast".
- **Mediterranean/harbour city kit**: search "Mediterranean city" / "coastal
  town modular". Needs lit-window night materials or emissive-able windows.
- **Marina/yachts**: "marina pack" / "yacht". A handful of hulls + masts.
- **Crowd**: "stadium crowd" (billboard/animated instanced crowd — grandstand
  atmosphere; camera flashes are a Niagara emitter, free).
- Free from Epic: **City Sample Vehicles** (background traffic if ever needed).

## 4. The scene (user assembles; mirror of the three.js hero, upgraded)

Recreate the composition that already works — do not redesign it:

- **Set**: one ~120 m harbour straight. Track at x/y origin; 1 m concrete
  wall with Armco on the far side; marina band behind it (water + yachts);
  tiered pastel city rising behind the marina; corner buildings closing both
  ends so the road visibly bends away behind them. Floodlight masts every
  ~12 m.
- **Night lighting**: no sun; moonlight directional at ~0.5 lux from the
  camera side; floodlight SpotLights (2 700 K, IES profiles if the pack has
  them) making alternating pools down the straight; emissive windows across
  the city; Lumen does the rest. Exponential height fog, slight warm tint,
  fog density so the far corner dissolves.
- **Wet track**: puddle/roughness-variation material on the racing line
  (most packs ship one; otherwise a simple roughness-mask decal layer), so the
  floodlights streak in the asphalt — the money reflection Lumen+RT buys us.
- **The race** (Level Sequence, ~14 s loop): five cars, red leader + gold
  challenger side-by-side, three field cars. Two-lap story: lap A the gold car
  lunges and falls short; lap B the pass sticks. Wheels spin (rotation track),
  slight body roll on the lunge. Exhaust flicker + rain-light strips; sparks
  (Niagara) under braking; light heat-haze material behind diffusers.
- **Cameras** (Sequencer, cutting on the beat): (1) trackside long-lens pan at
  the pass apex, f/2.8-ish DoF; (2) low kerb-level wide as the pack sweeps
  through a light pool; (3) high harbour establishing with the city + water
  reflections. Loop seamlessly. Add subtle handheld shake to (1).
- **Audio**: engine pass-by whoosh + distant PA murmur, ducked −12 dB (muted
  by default in the embed; browser autoplay rules).

Acceptance bar for a build: 1080p60 sustained on the chosen Vagon tier, no
visible loop seam, reads as a TV broadcast within 2 s of connecting.

## 5. Package & upload (user, per iteration)

1. File → Package Project → **Windows (64-bit)**, Shipping config.
2. Zip the packaged folder; upload the .zip in the Vagon Streams dashboard;
   pick the GPU tier; Vagon auto-wires Pixel Streaming/WebRTC.
3. Note the stream/app ID — the web embed consumes it via env/config.

## 6. Web embed (Claude; separate PR once a stream exists)

- `apps/web`: a "Enter cinema mode" affordance on the hero (3D tiers only),
  feature-flagged (`NEXT_PUBLIC_CINEMA_STREAM_ID` absent → button never
  renders — static export stays fully functional without it).
- Click → overlay with the Vagon iframe + **Streams JS SDK** for lifecycle
  (connecting/queued/failed → automatic return to the three.js hero;
  Esc/close → same). Session hard-capped client-side at ~5 min with a
  "keep watching?" prompt so an abandoned tab can't burn GPU-minutes.
- Budget guardrails live in the Vagon dashboard (cap + alerts) — the embed
  treats "no slot / cap reached" identically to "failed": silent fallback.

## 7. Iteration loop

User packages + uploads (≈10 min/round) → Claude reviews captures/notes →
adjustments in this doc's terms (light temperature, fog density, cut timing)
→ repeat. The three.js hero's tuned leva numbers are the starting values for
their UE equivalents — the two versions should read as the same scene.
