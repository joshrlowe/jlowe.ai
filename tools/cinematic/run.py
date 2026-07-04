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
import math
import os
import sys

TOOL_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOL_DIR)

import bpy  # noqa: E402
import mathutils  # noqa: E402

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
    ap.add_argument(
        "--car-studio",
        default=None,
        help="render ONE procedural car (by livery key) on a studio floor — fast car look-dev",
    )
    ap.add_argument("--angle", default="rear34", choices=["rear34", "front34", "side", "top"])
    return ap.parse_args(argv)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def build_all(cfg: dict) -> dict:
    counts = scene_builder.build_set(cfg)
    counts.update(choreography.build_race(cfg))
    counts.update(cameras.build_cameras(cfg))
    return counts


def car_studio(cfg: dict, livery: str, angle: str, out_dir: str) -> None:
    """One car, a grey floor, soft studio light — seconds-fast car look-dev."""
    import f1car
    import materials

    reset_scene()
    floor_mat = materials.simple("studio-floor", "#3c4046", roughness=0.5)
    mesh = bpy.data.meshes.new("studio-floor")
    mesh.from_pydata(
        [(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [[0, 1, 2, 3]]
    )
    mesh.materials.append(floor_mat)
    fl = bpy.data.objects.new("studio-floor", mesh)
    bpy.context.scene.collection.objects.link(fl)

    world = bpy.data.worlds.new("studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.18, 0.2, 0.24, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8

    for name, loc, energy in (
        ("key", (4, -5, 5), 800),
        ("fill", (-5, 3, 4), 300),
        ("rim", (-4, -3, 2.2), 400),
    ):
        light = bpy.data.lights.new(name, type="AREA")
        light.energy = energy
        light.size = 3.5
        lo = bpy.data.objects.new(name, light)
        lo.location = loc
        lo.rotation_euler = (
            (mathutils.Vector((0, 0, 0.6)) - mathutils.Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        )
        bpy.context.scene.collection.objects.link(lo)

    f1car.build_f1_car(0, livery)

    cam = bpy.data.cameras.new("studio-cam")
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(30)
    co = bpy.data.objects.new("studio-cam", cam)
    angles = {
        "rear34": (-6.5, -4.5, 2.4),
        "front34": (6.5, -4.5, 2.2),
        "side": (0, -8.5, 1.6),
        "top": (0.5, -0.01, 12),
    }
    co.location = angles[angle]
    co.rotation_euler = (
        (mathutils.Vector((0.2, 0, 0.45)) - mathutils.Vector(co.location))
        .to_track_quat("-Z", "Y")
        .to_euler()
    )
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co

    render.configure(cfg, "look", out_dir)
    bpy.context.scene.render.use_motion_blur = False
    path = os.path.join(out_dir, f"car-{livery}-{angle}.png")
    render.render_still(1, path)
    print(f"[cinematic] wrote {path}")


def main() -> None:
    args = parse_args()
    cfg = load_config()
    os.makedirs(args.out, exist_ok=True)

    if args.car_studio:
        car_studio(cfg, args.car_studio, args.angle, args.out)
        return

    reset_scene()
    counts = build_all(cfg)
    print(f"[cinematic] built: {counts}")

    if args.selftest:
        total = cfg["video"]["fps"] * cfg["video"]["laps"] * cfg["video"]["lapSeconds"]
        n_shots = len(cfg["video"]["shots"])
        n_cams = 4 if cfg["video"].get("drone") else 3
        n_cars = len(cfg["video"].get("grid") or cfg["raceCars"])
        assert counts["objects"] > 250, counts
        assert counts["cars"] == n_cars, counts
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
