"""Imports the car, clones the 5-car grid, and bakes the 2-lap race to
keyframes — the hero.tsx frame loop with the sine swap upgraded to the duel
story (lap A: the lunge falls short; lap B: the pass sticks)."""

from __future__ import annotations

import math
import os

import bpy

import materials
from lib.config import B, REPO_ROOT, yaw_to_bz
from lib.rail import CentripetalCatmullRom, car_param, pose_along_curve

# GLB material names → replacement intent, mirroring car-part.ts.
PART_MATERIALS = {
    "Material.006": ("trim", dict(hex="#15161a", roughness=0.3, metallic=0.75)),
    "Material.007": ("rim", dict(hex="#cfd3d9", roughness=0.26, metallic=1.0)),
    "Material.008": ("tire", dict(hex="#0a0a0c", roughness=0.88, metallic=0.0)),
    "Material.009": ("glass", dict(hex="#06080d", roughness=0.08, metallic=0.0)),
}


def _import_car(cfg: dict) -> bpy.types.Object:
    """Import the GLB once and wrap it in a rig empty whose +x_blender is the
    nose (the GLB noses −x; the wrapper child is pre-rotated π)."""
    path = os.path.join(REPO_ROOT, cfg["car"]["url"])
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    imported = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in imported if o.parent is None or o.parent in before]

    # holder (animated by the bake) → nose wrapper (static: π nose-fix, scale,
    # lift). The nose-fix must NOT live on the holder — the bake stomps the
    # holder's rotation every frame.
    holder = bpy.data.objects.new("car-proto-holder", None)
    nose = bpy.data.objects.new("car-proto-nose", None)
    bpy.context.scene.collection.objects.link(holder)
    bpy.context.scene.collection.objects.link(nose)
    nose.parent = holder
    nose.rotation_euler = (0, 0, math.pi)  # GLB noses −x → holder +x
    s = cfg["car"]["scale"]
    nose.scale = (s, s, s)
    nose.location = (0, 0, cfg["car"]["lift"])
    for r in roots:
        r.parent = nose

    # Re-skin the shared part materials once (mesh-level → applies to clones).
    for name, (_part, spec) in PART_MATERIALS.items():
        src = next((m for m in bpy.data.materials if m.name.startswith(name)), None)
        if src is None:
            continue
        repl = materials.simple(
            f"car-{_part}", spec["hex"], roughness=spec["roughness"], metallic=spec["metallic"]
        )
        for obj in imported:
            if obj.type != "MESH":
                continue
            for i, slot in enumerate(obj.material_slots):
                if slot.material is src:
                    obj.data.materials[i] = repl
    return holder


def _clone_car(proto: bpy.types.Object, index: int) -> bpy.types.Object:
    holder = proto.copy()
    holder.name = f"car-{index}-holder"
    bpy.context.scene.collection.objects.link(holder)
    for child in proto.children_recursive:
        cc = child.copy()  # linked duplicate — shared mesh data
        cc.name = f"{child.name}-car{index}"
        cc.parent = holder if child.parent is proto else None
        bpy.context.scene.collection.objects.link(cc)
    # reparent grandchildren correctly
    mapping = {proto: holder}
    for child in proto.children_recursive:
        clone = bpy.data.objects.get(f"{child.name}-car{index}")
        mapping[child] = clone
    for child in proto.children_recursive:
        clone = mapping[child]
        clone.parent = mapping.get(child.parent, holder)
    return holder


def _paint_body(rig: bpy.types.Object, cfg: dict, hex_color: str, index: int) -> None:
    """Per-car body livery via OBJECT-linked slots over the shared meshes."""
    paint = materials.car_paint(f"paint-{index}", hex_color, cfg["tuning"])
    body_name = cfg["car"]["bodyMaterialName"]
    for obj in [rig, *rig.children_recursive]:
        if obj.type != "MESH":
            continue
        for slot_i, slot in enumerate(obj.material_slots):
            mesh_mat = obj.data.materials[slot_i] if slot_i < len(obj.data.materials) else None
            src_name = (slot.material.name if slot.material else "") or (
                mesh_mat.name if mesh_mat else ""
            )
            # match the GLB body material OR an earlier car's paint (clones
            # copy the proto's already-painted OBJECT slots)
            if src_name.startswith(body_name) or src_name.startswith("paint-"):
                slot.link = "OBJECT"
                slot.material = paint


def _rain_light(rig: bpy.types.Object, cfg: dict, index: int) -> None:
    t = cfg["tuning"]
    mat = bpy.data.materials.get("rain-light") or materials.emissive(
        "rain-light", "#ff2222", t["rainLightEmissive"] * 10
    )
    mesh = bpy.data.meshes.get("rain-light-mesh")
    if mesh is None:
        import bmesh

        mesh = bpy.data.meshes.new("rain-light-mesh")
        b = bmesh.new()
        bmesh.ops.create_cube(b, size=1.0)
        b.to_mesh(mesh)
        b.free()
        mesh.materials.append(mat)
    obj = bpy.data.objects.new(f"rain-light-{index}", mesh)
    obj.scale = (0.04, 0.09, 0.14)  # blender: thin along nose axis (x)
    # rig space == three car space with nose +x_blender ↔ +z_three, so the
    # three-space tail (0, rainLightY, rainLightZ) lands at blender
    # (rainLightZ, 0, rainLightY) inside the rig (x=nose axis).
    obj.location = (t["rainLightZ"], 0, t["rainLightY"])
    obj.parent = rig
    bpy.context.scene.collection.objects.link(obj)


def build_race(cfg: dict) -> dict:
    curve = CentripetalCatmullRom(cfg["railPoints"])
    video = cfg["video"]
    tuning = cfg["tuning"]
    total = video["fps"] * video["laps"] * video["lapSeconds"]
    scene = bpy.context.scene
    scene.render.fps = video["fps"]
    scene.frame_start = 1
    scene.frame_end = total

    # Clone the FULL grid first, then dress each rig — painting or adding the
    # rain light before cloning would leak car-0's livery + a duplicate light
    # into every copy.
    proto = _import_car(cfg)
    rigs: list[bpy.types.Object] = [proto]
    for i in range(1, len(cfg["raceCars"])):
        rigs.append(_clone_car(proto, i))
    for i, car in enumerate(cfg["raceCars"]):
        rigs[i].name = f"car-{i}"
        _paint_body(rigs[i], cfg, car["bodyColor"], i)
        _rain_light(rigs[i], cfg, i)

    # camera-focus empties, baked alongside the cars
    focus = bpy.data.objects.new("battle-focus", None)
    pan_target = bpy.data.objects.new("pan-target", None)
    for e in (focus, pan_target):
        bpy.context.scene.collection.objects.link(e)

    leader_i = next(i for i, c in enumerate(cfg["raceCars"]) if c["role"] == "leader")
    chall_i = next(i for i, c in enumerate(cfg["raceCars"]) if c["role"] == "challenger")

    keys = video["duel"]["keys"]
    amp = tuning["passAmp"]
    laps = video["laps"]
    prev_yaw = [None] * len(rigs)
    pan_pos = None
    dt = 1.0 / video["fps"]
    # Video override: the web's heavy damping trails the pack by ~5 m, which
    # reads laggy in a broadcast cut — the cinematic pans snappier.
    damp = 1 - math.pow(video.get("panDamping", tuning["lookDamping"]), dt)

    for f in range(1, total + 1):
        u2 = (f - 1) / total
        poses = []
        for i, car in enumerate(cfg["raceCars"]):
            t_par = car_param(u2, laps, car["tOffset"], car["role"], keys, amp)
            lateral = tuning["challengerLane"] if car["role"] == "challenger" else 0.0
            pos, yaw = pose_along_curve(curve, t_par, lateral)
            # unwrap yaw so euler interpolation never spins the long way round
            if prev_yaw[i] is not None:
                while yaw - prev_yaw[i] > math.pi:
                    yaw -= 2 * math.pi
                while yaw - prev_yaw[i] < -math.pi:
                    yaw += 2 * math.pi
            prev_yaw[i] = yaw
            poses.append(pos)
            rig = rigs[i]
            rig.location = B(*pos)
            rig.rotation_euler = (0, 0, yaw_to_bz(yaw))
            rig.keyframe_insert("location", frame=f)
            rig.keyframe_insert("rotation_euler", frame=f)

        look_h = video.get("lookHeight", tuning["lookHeight"])
        mid = [
            (poses[leader_i][k] + poses[chall_i][k]) / 2 + (look_h if k == 1 else 0)
            for k in range(3)
        ]
        # clamp the pan like the web rig, then exponential-damp it
        clamp_z = video.get("clampZ", tuning["clampZ"])
        mid[0] = max(-tuning["clampX"], min(tuning["clampX"], mid[0]))
        mid[2] = max(-clamp_z, min(clamp_z, mid[2]))
        pan_pos = mid if pan_pos is None else [
            pan_pos[k] + (mid[k] - pan_pos[k]) * damp for k in range(3)
        ]
        focus.location = B(*mid)
        focus.keyframe_insert("location", frame=f)
        pan_target.location = B(*pan_pos)
        pan_target.keyframe_insert("location", frame=f)

    return {"cars": len(rigs), "frames": total}
