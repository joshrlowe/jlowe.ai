# Licenses & attributions

The running record of third-party asset licensing for jlowe.ai 2.0. Any future
asset (audio, texture, model, font) must be listed here with its source and
license **before it ships**.

## Audio

All chapter audio is **synthesized procedurally at runtime** via the Web Audio
API — an oscillator-based engine whose pitch tracks the car's rpm, over a
generated brown-noise ambient bed (`apps/web/src/components/world/audio/`).
There are **no third-party audio files** in this repository and nothing is
fetched at runtime, so no attribution is required.

## 3D models

- **`apps/web/public/models/car.glb`** — low-poly "Car" sedan from the **"Cars"
  pack by Quaternius** (quaternius.com). Quaternius releases all assets as
  **CC0** (public domain); the poly.pizza mirror this file was fetched from
  (`static.poly.pizza`, model `HQ0hvRM2XR`) labels it **CC-BY 3.0**. Either way
  it is original art (no real-brand car / livery) and attribution is given here.
  Only the body shell ships — the source's combined wheel meshes are dropped and
  the car runs on four code-generated wheels; the body is re-skinned at runtime
  with a clearcoat paint + tinted-glass material (`vehicle/car.tsx`). Used by the
  drivable circuit (Chapter 1).

### Sourced CC0 assets (hero scene)

The hero-scene proof-of-concept uses the following third-party assets. All are
**CC0 (public domain)** — no attribution is legally required; sources are
credited here as good practice. Every asset was geometry- or texture-optimized
for the web (Draco-compressed GLB geometry; textures resized to 1024² JPG). No
franchise/film/game IP is present in any model, node name, texture, or material.

**Car model**

- **`apps/web/public/hero/car/f1-car.glb`** — "Racing car" by **scaranto** via
  **Poly Pizza**, **CC0 1.0** (Public Domain). A generic open-wheel / F1-style
  single-seater — original art with **no real team livery or sponsor logos**.
  Source: https://poly.pizza/m/EMcTJiXibv
  The whole body is one mesh of five flat-coloured materials
  (`Material.005`–`Material.009`); no node names were changed. Optimized with
  gltf-transform (`dedup` → `weld` → `prune` → Draco geometry compression);
  the untextured TEXCOORD_0 attributes were pruned. ~1.1k triangles; the
  compressed GLB is ≈10 KB. Re-skinned at runtime with clearcoat paint, metallic
  rims, rough tires, dark cockpit glass, and dark trim (`scenes/hero/`).

**Roadside props**

- **`apps/web/public/hero/props/traffic-cone.glb`** — "Traffic Cone" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/lAx8JytxGD
- **`apps/web/public/hero/props/street-light.glb`** — "Street Light" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/nFwrlcLvM5
- **`apps/web/public/hero/props/traffic-light.glb`** — "Traffic Light" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/lg9AKWejnF

**Asphalt / road PBR textures**

- **`apps/web/public/hero/road/asphalt_albedo.jpg`**,
  **`apps/web/public/hero/road/asphalt_normal.jpg`** (OpenGL normal),
  **`apps/web/public/hero/road/asphalt_roughness.jpg`** — "Asphalt012" from
  **ambientCG**, **CC0** (Public Domain). Resized from 2K to 1024² JPG.
  Source: https://ambientcg.com/view?id=Asphalt012

## 3D geometry

The rest of the world geometry is original — generated in code or built from
primitives (the coastal circuit, the placeholder vehicle, cliffs, and foliage).
Nothing is derived from any franchise or third-party asset, per the project's
no-copyrighted-IP rule.

## PBR textures

CC0 (public domain) material sets from **ambientCG** (ambientcg.com). CC0
requires no attribution; credited here as good practice. Each set ships only the
albedo (Color), OpenGL normal (NormalGL), and roughness maps at 1K-JPG.

- **`apps/web/public/textures/road/asphalt_*.jpg`** — ambientCG **"Asphalt002"**.
  Tiled along the track ribbon's UVs (`scenes/circuit/track.tsx`) for the road
  surface.
- **`apps/web/public/textures/ground/rock_*.jpg`** — ambientCG **"Rock035"**
  (dark volcanic rock). Tiles the coastal land plane and the cliff instances
  (`scenes/circuit/scenery.tsx`).

## HDRI / environment maps

- **`apps/web/public/hdri/venice_sunset_1k.hdr`** — "Venice Sunset" via
  **Poly Haven**, **CC0** (public domain; no attribution required, credited
  here as good practice). Drives WebGPU image-based lighting; on the circuit it
  also provides the sky background. The WebGL2/mobile tiers use a zero-byte
  procedural sky instead.
- **`apps/web/public/hdri/belfast_sunset_puresky_1k.hdr`** — "Belfast Sunset
  (Pure Sky)" via **Poly Haven**, **CC0** (public domain; no attribution
  required, credited here as good practice). A skyline-free golden-hour sky used
  as the **hero** scene's visible background (an F1 track, not a city); the
  Venice HDRI still drives image-based lighting there.

## Fonts

_None bundled yet — list each web font and its license here when added._
