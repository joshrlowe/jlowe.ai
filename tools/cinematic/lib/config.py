"""Config loading + coordinate/colour helpers shared by the bpy modules."""

from __future__ import annotations

import json
import os

TOOL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(os.path.dirname(TOOL_DIR))


def load_config() -> dict:
    with open(os.path.join(TOOL_DIR, "scene-config.json"), "r", encoding="utf8") as f:
        return json.load(f)


def B(x: float, y: float, z: float) -> tuple[float, float, float]:
    """three.js (right-handed, y-up) → Blender (right-handed, z-up):
    (x, y, z) → (x, −z, y). Same mapping the glTF importer applies, so
    procedural geometry and imported models share one world."""
    return (x, -z, y)


def yaw_to_bz(yaw: float) -> float:
    """three yaw (0 = nose +z_three, +π/2 = nose +x) → Blender z-rotation for
    a rig whose nose points +x_blender at rotation 0. +z_three maps to
    −y_blender, so φ = yaw − π/2."""
    import math

    return yaw - math.pi / 2


def srgb_hex_to_linear(hex_str: str) -> tuple[float, float, float]:
    h = hex_str.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin(r), lin(g), lin(b))


def srgb255_to_linear(rgb: list[float]) -> tuple[float, float, float]:
    def lin(c: float) -> float:
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin(rgb[0]), lin(rgb[1]), lin(rgb[2]))
