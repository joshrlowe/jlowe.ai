# Licenses & attributions

The running record of third-party asset licensing for jlowe.ai 2.0. Any future
asset (audio, texture, model, font) must be listed here with its source and
license **before it ships**.

> The retired Chapter 1 driving world (hero night vignette, drivable circuit,
> and their CC0-sourced models/textures) now lives in the standalone
> **jlowe-world** repo; its asset attributions moved with it.

## Audio

All chapter audio is **synthesized procedurally at runtime** via the Web Audio
API — an oscillator-based engine synth whose pitch tracks the active vehicle's
rpm, over a generated brown-noise ambient bed
(`apps/web/src/components/world/audio/`). There are **no third-party audio
files** in this repository and nothing is fetched at runtime, so no attribution
is required.

## 3D geometry

All world geometry is original — generated in code or built from primitives
(the in-transit starfield, the physics fixture scene). Nothing is derived from
any franchise or third-party asset, per the project's no-copyrighted-IP rule.

## HDRI / environment maps

- **`apps/web/public/hdri/venice_sunset_1k.hdr`** — "Venice Sunset" via
  **Poly Haven**, **CC0** (public domain; no attribution required, credited
  here as good practice). Drives WebGPU image-based lighting + the sky
  background for the golden-hour rig (`core/environment.tsx`, used by the
  fixture scene). The WebGL2/mobile tiers use a zero-byte procedural sky
  instead.

## Fonts

_None bundled yet — list each web font and its license here when added._
