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

## 3D geometry & textures

Most world geometry is original — generated in code or built from primitives
(the coastal circuit, the placeholder vehicle, cliffs, and foliage). Nothing is
derived from any franchise or third-party asset, per the project's
no-copyrighted-IP rule.

### Sourced CC0 assets (hero scene)

The hero-scene proof-of-concept uses the following third-party assets. All are
**CC0 (public domain)** — no attribution is legally required; sources are
credited here as good practice. Every asset was geometry- or texture-optimized
for the web (Draco-compressed GLB geometry; textures resized to 1024² JPG). No
franchise/film/game IP is present in any model, node name, texture, or material.

**Car model**

- **`apps/web/public/assets/car/sports-car.glb`** — "Sports Car" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/1mkmFkAz5v
  Original mesh node names were remapped for the vehicle rig to
  `chassis`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR` (the source merged
  both rear wheels into one mesh; it was split into `wheel_RL`/`wheel_RR`).
  Geometry Draco-compressed.

**Roadside props**

- **`apps/web/public/assets/props/traffic-cone.glb`** — "Traffic Cone" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/lAx8JytxGD
- **`apps/web/public/assets/props/street-light.glb`** — "Street Light" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/nFwrlcLvM5
- **`apps/web/public/assets/props/traffic-light.glb`** — "Traffic Light" by
  **Quaternius** via **Poly Pizza**, **CC0** (Public Domain).
  Source: https://poly.pizza/m/lg9AKWejnF

**Asphalt / road PBR textures**

- **`apps/web/public/assets/road/asphalt_albedo.jpg`**,
  **`apps/web/public/assets/road/asphalt_normal.jpg`** (OpenGL normal),
  **`apps/web/public/assets/road/asphalt_roughness.jpg`** — "Asphalt012" from
  **ambientCG**, **CC0** (Public Domain). Resized from 2K to 1024² JPG.
  Source: https://ambientcg.com/view?id=Asphalt012

## HDRI / environment maps

- **`apps/web/public/hdri/venice_sunset_1k.hdr`** — "Venice Sunset" via
  **Poly Haven**, **CC0** (public domain; no attribution required, credited
  here as good practice). Drives WebGPU image-based lighting + the sky
  background; the WebGL2/mobile tiers use a zero-byte procedural sky instead.

## Fonts

_None bundled yet — list each web font and its license here when added._
