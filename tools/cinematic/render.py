"""Cycles configuration + render presets (Metal GPU, adaptive sampling, OIDN,
AgX view transform — the same tone curve family as the web hero's grade)."""

from __future__ import annotations

import math

import bpy

PRESETS = {
    "preview": dict(x=960, y=540, samples=48, adaptive=0.05, volume_step_rate=2.0),
    "look": dict(x=1280, y=720, samples=96, adaptive=0.03, volume_step_rate=1.5),
    "final": dict(x=1920, y=1080, samples=224, adaptive=0.012, volume_step_rate=1.0),
}


def enable_metal() -> None:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True


def configure(cfg: dict, preset_name: str, out_dir: str) -> None:
    p = PRESETS[preset_name]
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    enable_metal()
    scene.cycles.device = "GPU"
    scene.cycles.samples = p["samples"]
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = p["adaptive"]
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.volume_step_rate = p["volume_step_rate"]
    scene.cycles.volume_bounces = 0
    scene.cycles.max_bounces = 8
    scene.cycles.glossy_bounces = 6

    scene.render.use_motion_blur = True
    scene.render.motion_blur_shutter = 0.5  # 180° shutter

    scene.render.resolution_x = p["x"]
    scene.render.resolution_y = p["y"]
    scene.render.resolution_percentage = 100

    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Base Contrast"
    scene.view_settings.exposure = math.log2(cfg["tuning"]["exposure"]) + 0.4

    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = out_dir.rstrip("/") + "/frame-"


def render_animation(frame_start: int, frame_end: int) -> None:
    scene = bpy.context.scene
    scene.frame_start = frame_start
    scene.frame_end = frame_end
    bpy.ops.render.render(animation=True)


def render_still(frame: int, path: str) -> None:
    scene = bpy.context.scene
    scene.frame_set(frame)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
