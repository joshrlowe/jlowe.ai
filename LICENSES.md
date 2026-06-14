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

All world geometry is original — generated in code or built from primitives
(the coastal circuit, the placeholder vehicle, cliffs, and foliage). Lighting is
a procedural golden-hour environment (no HDR files). Nothing is derived from any
franchise or third-party asset, per the project's no-copyrighted-IP rule.

## Fonts

_None bundled yet — list each web font and its license here when added._
