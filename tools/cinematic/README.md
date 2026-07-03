# tools/cinematic — the pre-rendered hero pipeline

Headless Blender (Cycles) build of the Monaco night-race cinematic: the SAME
scene as `/world/?scene=hero` (identical seeded scatter, rail, liveries,
lighting design — see `scene-config.json`, parity-tested against the TS
constants in CI), path-traced to a ~19 s seam-free loop and shipped as the
flat `/` video hero.

## Requirements (local only — never in CI)

- Blender 4.5 LTS (arm64): `~/Applications/Blender.app`
- ffmpeg with libsvtav1 + libx264: `~/bin/ffmpeg`

## Commands

```bash
BLENDER=~/Applications/Blender.app/Contents/MacOS/Blender

# structural check (no render)
$BLENDER -b -P tools/cinematic/run.py -- --selftest

# one frame for eyeballing (fast)
$BLENDER -b -P tools/cinematic/run.py -- --still 120 --preset preview

# a shot's worth of preview frames
$BLENDER -b -P tools/cinematic/run.py -- --preset preview --frames 90-140

# the full final render (hours — run overnight)
$BLENDER -b -P tools/cinematic/run.py -- --preset final

# encode (after a final render)
~/bin/ffmpeg -framerate 24 -i tools/cinematic/out/frame-%04d.png \
  -c:v libsvtav1 -crf 38 -preset 6 -pix_fmt yuv420p10le hero-loop.webm
~/bin/ffmpeg -framerate 24 -i tools/cinematic/out/frame-%04d.png \
  -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p -movflags +faststart hero-loop.mp4
```

Outputs land in `tools/cinematic/out/` (git-ignored). The `--save-blend` flag
writes the built scene for debugging in the Blender UI.

## Layout

- `scene-config.json` — single source of truth; parity-tested fields must be
  edited in the TS hero first (see `_provenance`).
- `lib/scatter.py` — bit-exact mulberry32 port (verified against node).
- `lib/rail.py` — centripetal Catmull-Rom + arc-length param + the 2-lap duel.
- `scene.py` / `materials.py` — the set + Cycles shaders (real lights where the
  web fakes emissives).
- `choreography.py` — car import/cloning/liveries + baked race keyframes.
- `cameras.py` — 3-camera broadcast cut package (marker-bound).
- `render.py` — Metal/Cycles presets (preview/look/final).
- `run.py` — CLI entry.

## Swapping in the real car

Drop the purchased model in `packages/asset-pipeline/raw-assets/`, convert to
glTF if needed, and point `car.url` in `scene-config.json` at it (repo-root
relative). `car.bodyMaterialName` selects which material gets the per-car
livery; wheels with separable nodes get spin in a follow-up to
`choreography.py`.
