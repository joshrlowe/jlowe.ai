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
  with a clearcoat paint + tinted-glass material (`vehicle/car.tsx`).

## 3D geometry

The rest of the world geometry is original — generated in code or built from
primitives (the coastal circuit, the road wheels, cliffs, and foliage). Nothing
is derived from any franchise or third-party asset, per the project's
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
  here as good practice). Drives WebGPU image-based lighting + the sky
  background; the WebGL2/mobile tiers use a zero-byte procedural sky instead.

## Fonts

_None bundled yet — list each web font and its license here when added._
