"""Cycles materials for the cinematic. Everything the web scene fakes with
emissive tricks is REAL here — path tracing gives actual bounce light from the
windows, actual reflections in the water and wet asphalt — so these shaders
are deliberately simpler than their TSL counterparts."""

from __future__ import annotations

import bpy

from lib.config import srgb_hex_to_linear


def _new(name: str) -> tuple[bpy.types.Material, bpy.types.ShaderNodeTree]:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat, mat.node_tree


def _bsdf(tree: bpy.types.ShaderNodeTree) -> bpy.types.ShaderNode:
    return tree.nodes["Principled BSDF"]


def simple(name, hex_color, roughness=0.8, metallic=0.0) -> bpy.types.Material:
    mat, tree = _new(name)
    b = _bsdf(tree)
    b.inputs["Base Color"].default_value = (*srgb_hex_to_linear(hex_color), 1)
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Metallic"].default_value = metallic
    return mat


def car_paint(name: str, hex_color: str, tuning: dict) -> bpy.types.Material:
    """Two-coat automotive paint: metallic base under a sharp clearcoat."""
    mat, tree = _new(name)
    b = _bsdf(tree)
    b.inputs["Base Color"].default_value = (*srgb_hex_to_linear(hex_color), 1)
    b.inputs["Metallic"].default_value = min(tuning["bodyMetalness"], 0.9)
    b.inputs["Roughness"].default_value = tuning["bodyRoughness"]
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Coat Roughness"].default_value = 0.04
    return mat


def wet_asphalt(name: str, set_cfg: dict) -> bpy.types.Material:
    """Asphalt with a noise-driven puddle mask: dry rough vs mirror-wet, plus a
    fine bump so floodlights streak instead of mirroring perfectly."""
    mat, tree = _new(name)
    n = tree.nodes
    b = _bsdf(tree)
    # real asphalt albedo ~0.07-0.12 — pure black eats the spot pools
    b.inputs["Base Color"].default_value = (0.062, 0.062, 0.07, 1)

    # Object-space coords: the default Generated coords are bbox-normalised,
    # which breaks noise scale on the loop-long road ribbon.
    coords = n.new("ShaderNodeTexCoord")

    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 0.35
    tex.inputs["Detail"].default_value = 6.0
    tree.links.new(coords.outputs["Object"], tex.inputs["Vector"])

    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.46
    ramp.color_ramp.elements[0].color = (0.05, 0.05, 0.05, 1)  # wet: near-mirror
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (0.62, 0.62, 0.62, 1)  # dry: rough

    grain = n.new("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 90.0
    grain.inputs["Detail"].default_value = 4.0
    tree.links.new(coords.outputs["Object"], grain.inputs["Vector"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06

    tree.links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
    tree.links.new(ramp.outputs["Color"], b.inputs["Roughness"])
    tree.links.new(grain.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return mat


def water(name: str) -> bpy.types.Material:
    mat, tree = _new(name)
    n = tree.nodes
    b = _bsdf(tree)
    b.inputs["Base Color"].default_value = (0.006, 0.02, 0.022, 1)
    b.inputs["Roughness"].default_value = 0.02
    b.inputs["Metallic"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.33
    waves = n.new("ShaderNodeTexNoise")
    waves.inputs["Scale"].default_value = 1.4
    waves.inputs["Detail"].default_value = 8.0
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    tree.links.new(waves.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return mat


def facade_windows(
    name: str,
    base_hex: str,
    cfg: dict,
    window_rgb: tuple[float, float, float] = (1.0, 0.62, 0.28),
) -> bpy.types.Material:
    """Facade with the emissive window grid — the same dominant-normal trick
    as the web's TSL shader, built from Cycles nodes: the grid's horizontal
    coordinate is world-x on ±y(three z) faces and world-y on ±x faces; roofs
    are masked; a per-cell hash lights `windowLitRatio` of cells. In Cycles
    these windows genuinely LIGHT the street and the water. `window_rgb` picks
    the pane temperature (Abu-Dhabi towers run cool with a warm minority)."""
    win_w = cfg["set"]["buildings"]["winW"]
    win_h = cfg["set"]["buildings"]["winH"]
    # video override: a real city at night is ~a third lit, not 60%
    lit_ratio = cfg["video"].get("windowLitRatio", cfg["tuning"]["windowLitRatio"])
    emissive = cfg["tuning"]["windowEmissive"]

    mat, tree = _new(name)
    n = tree.nodes
    ln = tree.links.new
    b = _bsdf(tree)
    b.inputs["Base Color"].default_value = (*srgb_hex_to_linear(base_hex), 1)
    # glassier than the Monaco pastels — modern curtain-wall towers
    b.inputs["Roughness"].default_value = 0.45
    b.inputs["Metallic"].default_value = 0.15

    geo = n.new("ShaderNodeNewGeometry")
    sep_p = n.new("ShaderNodeSeparateXYZ")
    sep_n = n.new("ShaderNodeSeparateXYZ")
    ln(geo.outputs["Position"], sep_p.inputs["Vector"])
    ln(geo.outputs["Normal"], sep_n.inputs["Vector"])

    def absnode(src):
        m = n.new("ShaderNodeMath")
        m.operation = "ABSOLUTE"
        ln(src, m.inputs[0])
        return m.outputs[0]

    ax = absnode(sep_n.outputs["X"])
    ay = absnode(sep_n.outputs["Y"])
    az = absnode(sep_n.outputs["Z"])

    def math2(op, a, bsrc=None, const=None):
        m = n.new("ShaderNodeMath")
        m.operation = op
        if isinstance(a, (int, float)):
            m.inputs[0].default_value = a
        else:
            ln(a, m.inputs[0])
        if const is not None:
            m.inputs[1].default_value = const
        elif bsrc is not None:
            if isinstance(bsrc, (int, float)):
                m.inputs[1].default_value = bsrc
            else:
                ln(bsrc, m.inputs[1])
        return m.outputs[0]

    # Dominant-normal select without the Mix node (its duplicate A/B socket
    # names across data types are a scripting trap): horiz = lerp(Y, X, gt)
    # where gt = |ny| > |nx| (a y-facing wall varies along blender-X, an
    # x-facing wall — the camera-facing facades — along blender-Y = three-z).
    gt = math2("GREATER_THAN", ay, ax)
    one_minus = math2("SUBTRACT", 1.0, gt)
    horiz = math2(
        "ADD",
        math2("MULTIPLY", sep_p.outputs["Y"], one_minus),
        math2("MULTIPLY", sep_p.outputs["X"], gt),
    )
    vert = sep_p.outputs["Z"]  # blender Z = three Y (height)

    gx = math2("FRACT", math2("DIVIDE", horiz, win_w), None)
    gy = math2("FRACT", math2("DIVIDE", vert, win_h), None)

    def band(v, lo, hi):
        a = math2("GREATER_THAN", v, lo)
        bb = math2("LESS_THAN", v, hi)
        return math2("MULTIPLY", a, bb)

    pane = math2("MULTIPLY", band(gx, 0.2, 0.8), band(gy, 0.28, 0.9))

    cellx = math2("FLOOR", math2("DIVIDE", horiz, win_w), None)
    celly = math2("FLOOR", math2("DIVIDE", vert, win_h), None)
    cell = math2(
        "ADD", math2("MULTIPLY", cellx, 12.99), math2("MULTIPLY", celly, 78.23)
    )
    hashv = math2("FRACT", math2("MULTIPLY", math2("SINE", cell, None), 43758.5))
    lit = math2("GREATER_THAN", hashv, 1 - lit_ratio)

    # roofs (|nz| dominant) never glow
    wall = math2("LESS_THAN", az, 0.5)

    # ×2 over the web's bloom-calibrated value: in Cycles these windows are a
    # real light source, but the FLOODLIGHT RIG must stay the dominant light
    # on track — windows are the backdrop, not the key.
    strength = math2(
        "MULTIPLY", math2("MULTIPLY", pane, lit), math2("MULTIPLY", wall, emissive * 2)
    )
    ln(strength, b.inputs["Emission Strength"])
    b.inputs["Emission Color"].default_value = (*window_rgb, 1)
    return mat


def emissive(name, hex_color, strength) -> bpy.types.Material:
    mat, tree = _new(name)
    b = _bsdf(tree)
    b.inputs["Base Color"].default_value = (*srgb_hex_to_linear(hex_color), 1)
    b.inputs["Emission Color"].default_value = (*srgb_hex_to_linear(hex_color), 1)
    b.inputs["Emission Strength"].default_value = strength
    return mat
