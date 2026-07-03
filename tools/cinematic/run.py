"""Headless entry point for the cinematic pipeline.

Usage (Blender's bundled Python; args after `--` are ours):

  BLENDER=~/Applications/Blender.app/Contents/MacOS/Blender
  $BLENDER -b -P tools/cinematic/run.py -- --selftest
  $BLENDER -b -P tools/cinematic/run.py -- --still 120 --preset preview
  $BLENDER -b -P tools/cinematic/run.py -- --preset preview --frames 1-120
  $BLENDER -b -P tools/cinematic/run.py -- --preset final            # full loop
  $BLENDER -b -P tools/cinematic/run.py -- --save-blend              # inspect

Frames land in tools/cinematic/out/ (git-ignored)."""

from __future__ import annotations

import argparse
import os
import sys

TOOL_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOL_DIR)

import bpy  # noqa: E402

import cameras  # noqa: E402
import choreography  # noqa: E402
import render  # noqa: E402
import scene as scene_builder  # noqa: E402
from lib.config import load_config  # noqa: E402


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--preset", default="preview", choices=sorted(render.PRESETS))
    ap.add_argument("--frames", default=None, help="A-B inclusive; default full loop")
    ap.add_argument("--still", type=int, default=None, help="render a single frame")
    ap.add_argument("--out", default=os.path.join(TOOL_DIR, "out"))
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--save-blend", action="store_true")
    ap.add_argument("--camera", default=None, help="force a camera for --still")
    ap.add_argument("--probe", type=int, default=None, help="print car positions at frame")
    return ap.parse_args(argv)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def build_all(cfg: dict) -> dict:
    counts = scene_builder.build_set(cfg)
    counts.update(choreography.build_race(cfg))
    counts.update(cameras.build_cameras(cfg))
    return counts


def main() -> None:
    args = parse_args()
    cfg = load_config()
    os.makedirs(args.out, exist_ok=True)

    reset_scene()
    counts = build_all(cfg)
    print(f"[cinematic] built: {counts}")

    if args.selftest:
        total = cfg["video"]["fps"] * cfg["video"]["laps"] * cfg["video"]["lapSeconds"]
        n_shots = len(cfg["video"]["shots"])
        n_cams = 4 if cfg["video"].get("drone") else 3
        assert counts["objects"] > 250, counts
        assert counts["cars"] == 5, counts
        assert counts["frames"] == total, counts
        assert counts["cameras"] == n_cams and counts["shots"] == n_shots, counts
        assert len(bpy.context.scene.timeline_markers) == n_shots
        print("[cinematic] selftest OK")
        if args.save_blend:
            bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.out, "selftest.blend"))
        return

    if args.probe is not None:
        bpy.context.scene.frame_set(args.probe)
        deps = bpy.context.evaluated_depsgraph_get()
        for i in range(5):
            raw = bpy.data.objects[f"car-{i}"]
            o = raw.evaluated_get(deps)
            x, y, z = o.matrix_world.translation
            kids = raw.children_recursive  # raw graph — evaluated copies lie
            meshes = [c for c in kids if c.type == "MESH"]
            mats = sorted(
                {
                    (s.material.name if s.material else "-")
                    for c in meshes
                    for s in c.material_slots
                }
            )
            print(
                f"[probe] car-{i} blender=({x:+.1f},{y:+.1f},{z:+.2f}) "
                f"kids={len(kids)} meshes={len(meshes)} mats={mats}"
            )
        for name in ("pan-target", "battle-focus", "drone-cam-pos", "cam-drone"):
            o = bpy.data.objects[name].evaluated_get(deps)
            x, y, z = o.matrix_world.translation
            print(f"[probe] {name} blender=({x:+.1f},{y:+.1f},{z:+.2f})")
        print(f"[probe] active camera @f{args.probe}: {bpy.context.scene.camera.name}")
        return

    render.configure(cfg, args.preset, args.out)
    if args.camera:
        # markers rebind scene.camera on frame_set — drop them when forcing
        bpy.context.scene.timeline_markers.clear()
        bpy.context.scene.camera = bpy.data.objects[args.camera]

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.out, "scene.blend"))

    if args.still is not None:
        path = os.path.join(args.out, f"still-{args.still:04d}-{args.preset}.png")
        render.render_still(args.still, path)
        print(f"[cinematic] wrote {path}")
        return

    total = cfg["video"]["fps"] * cfg["video"]["laps"] * cfg["video"]["lapSeconds"]
    if args.frames:
        a, b = (int(v) for v in args.frames.split("-"))
    else:
        a, b = 1, total
    render.render_animation(a, b)
    print(f"[cinematic] rendered frames {a}-{b} to {args.out}")


if __name__ == "__main__":
    main()
