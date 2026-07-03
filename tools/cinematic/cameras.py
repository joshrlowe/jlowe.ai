"""The broadcast camera package: three cameras + marker-bound cuts on the
race's beats (config video.shots). Cut points are phase-locked to the duel, so
the loop point lands ON a cut and the seam is invisible by construction."""

from __future__ import annotations

import math

import bpy

from lib.config import B


def _camera(name: str, loc_three, fov_deg: float) -> bpy.types.Object:
    cam = bpy.data.cameras.new(name)
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(fov_deg)  # three.js fov is vertical
    cam.clip_end = 500
    obj = bpy.data.objects.new(name, cam)
    obj.location = B(*loc_three)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _track(obj: bpy.types.Object, target: bpy.types.Object) -> None:
    c = obj.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"


def _static_empty(name: str, loc_three) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    e.location = B(*loc_three)
    bpy.context.scene.collection.objects.link(e)
    return e


def _handheld(obj: bpy.types.Object, scale: float, strength: float, seed_phase: float) -> None:
    """Deterministic handheld drift: noise F-modifiers on the location curves
    (phase-seeded, so renders are reproducible)."""
    obj.keyframe_insert("location", frame=1)
    obj.keyframe_insert("location", frame=2)
    action = obj.animation_data.action
    for i, fc in enumerate(action.fcurves):
        if fc.data_path != "location":
            continue
        mod = fc.modifiers.new("NOISE")
        mod.scale = scale
        mod.strength = strength
        mod.phase = seed_phase + i * 13.7


def build_cameras(cfg: dict) -> dict:
    t = cfg["tuning"]
    video = cfg["video"]
    scene = bpy.context.scene
    total = video["fps"] * video["laps"] * video["lapSeconds"]

    pan_target = bpy.data.objects["pan-target"]
    focus = bpy.data.objects["battle-focus"]

    # 1 — trackside long-lens pan. Pulled BACK from the web vantage (−8 →
    # video.camX −14) with a longer lens: at 8 m the pan whips ~130° in a
    # second as the pack passes abeam and the whole frame smears; from
    # further out with tight tracking the CAR stays pinned + sharp while the
    # city does the smearing — the broadcast money look.
    cam_x = video.get("camX", t["camX"])
    cam_y = video.get("camY", t["camY"])
    fov = video.get("fov", t["fov"])
    trackside = _camera("cam-trackside", (cam_x, cam_y, t["camZ"]), fov)
    _track(trackside, pan_target)
    trackside.data.dof.use_dof = True
    trackside.data.dof.focus_object = focus
    trackside.data.dof.aperture_fstop = 2.2
    _handheld(trackside, scale=45, strength=0.03, seed_phase=3.1)

    # 2 — low kerb-level wide: the pack sweeps INTO the lens through a pool.
    # Hugs the road edge and aims DOWN the road so tarmac + oncoming cars own
    # the frame (the camera-side ground is deliberately undressed).
    kerb_aim = _static_empty("kerb-aim", (0.6, 0.75, -2))
    kerb = _camera("cam-kerb", (-3.6, 0.7, 20), 55)
    _track(kerb, kerb_aim)
    kerb.data.dof.use_dof = True
    kerb.data.dof.focus_object = kerb_aim
    kerb.data.dof.aperture_fstop = 2.8
    _handheld(kerb, scale=30, strength=0.02, seed_phase=8.9)

    # 3 — high harbour establishing: city + water + the full light rig; slow
    # push along the quay.
    high_aim = _static_empty("high-aim", (-0.5, 0.8, -3))
    high = _camera("cam-high", (-13, 9, -28), 32)
    _track(high, high_aim)
    high.keyframe_insert("location", frame=1)
    high.location = B(-13, 8.4, -22)
    high.keyframe_insert("location", frame=total)
    # linear dolly
    for fc in high.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    # 4 — the drone: parented to the baked follow empty, tracking the battle.
    # Deep focus (small-sensor drone look — also the sharpness fix), light
    # float noise for the FPV feel.
    cams = {"cam-trackside": trackside, "cam-kerb": kerb, "cam-high": high}
    drone_cfg = video.get("drone")
    if drone_cfg:
        drone = _camera("cam-drone", (0, 0, 0), drone_cfg.get("fov", 47))
        drone.parent = bpy.data.objects["drone-cam-pos"]
        drone.location = (0, 0, 0)
        _track(drone, focus)
        drone.data.dof.use_dof = False
        _handheld(drone, scale=55, strength=0.04, seed_phase=12.3)
        cams["cam-drone"] = drone

    # marker-bound cuts
    scene.timeline_markers.clear()
    for shot in video["shots"]:
        frame = max(1, int(round(shot["u2Start"] * total)) + 1)
        m = scene.timeline_markers.new(shot["name"], frame=frame)
        m.camera = cams[shot["camera"]]
    scene.camera = cams[video["shots"][0]["camera"]]

    return {"cameras": len(cams), "shots": len(video["shots"])}
