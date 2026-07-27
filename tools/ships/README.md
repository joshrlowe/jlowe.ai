# tools/ships — the Anchorage shipyard

Parametric, self-contained `bpy` builders for the space-world fleet
(concept: "Anchorage", P0), in the engineering style of
`tools/cinematic/f1car.py`: pure functions, station-loft cross-sections, one
shared unit-cube mesh for every greeble, liveries as colour language only —
original silhouettes and names throughout (no franchise shapes or marks).

| Ship | Class | Silhouette rules |
|---|---|---|
| `kestrel` | Kestrel-class skirmisher (hero fighter) | Trimaran: slim central fuselage, two outboard thrust booms, forward canards, single dorsal fin, faceted canopy ridge (no ball cockpit, no cruciform foils). Bone-white/graphite, teal accents, amber engines. |
| `glitch` | Glitch-class drone (the Static) | Irregular faceted dart, chisel prow, matte void-black, ONE red sensor slit, ember nozzle. Menacing, cheap, swarm-able. |
| `crucible` | LCV Crucible (forge-carrier flagship) | REVERSED-KEEL wedge — deepest at the bow, keel rising to the stern; conning tower offset to PORT; stern forge-bay collar glowing amber; greeble city flanks; teal running lights; compass-star insignia on the tower. Deliberately not a dagger-plus-belly-hangar-plus-centred-tower. |

## Requirements (local only — never in CI)

Blender 4.5 LTS (arm64): `~/Applications/Blender.app`. Cycles renders on
Metal; stills take seconds each.

## Commands

```bash
BLENDER=~/Applications/Blender.app/Contents/MacOS/Blender

# structural check (build all three, assert tri budgets + instancing, no render)
$BLENDER -b -P tools/ships/shipyard.py -- --selftest

# one ship, one angle
$BLENDER -b -P tools/ships/shipyard.py -- --ship kestrel --angle front34

# full dailies: every ship, its standard angle set, plus the fleet composite
$BLENDER -b -P tools/ships/shipyard.py -- --ship all --out /path/to/dailies

# inspect a build in the Blender UI
$BLENDER -b -P tools/ships/shipyard.py -- --ship crucible --save-blend
```

Flags:

- `--ship kestrel|glitch|crucible|fleet|all` (default `all`). `fleet` is one
  composite still at true relative scale — Glitch tiny, Kestrel small,
  Crucible huge.
- `--angle front34|side|rear34|top|all` (default `all` = the ship's standard
  set; Crucible adds `top`). The Crucible's 3/4 shots come from the port side,
  where the offset tower lives.
- `--out DIR` (default `tools/ships/out/`, git-ignored)
- `--width N` (default 960; 16:9 frame), `--samples N` (default 48)
- `--save-blend` writes `<ship>.blend` next to the stills

## How it renders

Studio dailies on a near-black backdrop: per-SHOT light rig positioned
relative to the camera axis (cool key upper-left, teal rim behind-left, amber
rim behind-right-low) so silhouettes read identically at every angle — a
world-fixed rig floods whichever flank the camera faces. Cycles Metal,
adaptive sampling, OIDN denoise, AgX. Cameras auto-frame from the bbox by
per-corner projection (not a bounding-sphere guess).

## P0 status and the GLB pass

These are silhouette/look-dev builds for owner approval (concept §7 P0). Tri
counts are mid-detail: Kestrel ~2.4k, Glitch ~0.3k, Crucible ~4k. The real
asset pass (P1/P2) adds panel-line greeble density toward the ~30k / ~3k /
~120k budgets, UV + trim-sheet materials, and glTF export through
`packages/asset-pipeline` (Draco/Meshopt + KTX2).
