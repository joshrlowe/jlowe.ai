"""Builds the Monaco night set in Blender — the SAME city as the three.js
hero: identical seeded scatter (lib/scatter.py is bit-exact with the web's
mulberry32), identical layout constants (scene-config.json), converted
three→Blender coordinates via lib.config.B."""

from __future__ import annotations

import math

import bmesh
import bpy
import mathutils

import materials
from lib.config import B
from lib.scatter import scatter


def _link(obj: bpy.types.Object) -> None:
    bpy.context.scene.collection.objects.link(obj)


def _unit_cube() -> bpy.types.Mesh:
    """ONE shared unit-cube mesh for every box in the set; per-object materials
    ride object-linked slots, so ~300 set pieces cost one mesh datablock."""
    mesh = bpy.data.meshes.get("unit-cube")
    if mesh is None:
        mesh = bpy.data.meshes.new("unit-cube")
        b = bmesh.new()
        bmesh.ops.create_cube(b, size=1.0)
        b.to_mesh(mesh)
        b.free()
        mesh.materials.append(None)  # slot 0 exists → objects can OBJECT-link
    return mesh


def box(name, size_three, loc_three, mat, rot_z: float = 0.0) -> bpy.types.Object:
    """A unit cube scaled to `size_three` (w,h,d in three-space: x,y,z) at
    `loc_three` (three-space CENTER). Handles the axis swap."""
    obj = bpy.data.objects.new(name, _unit_cube())
    sx, sy, sz = size_three
    obj.scale = (sx, sz, sy)  # three (w,h,d) → blender (x=w, y=d, z=h)
    obj.location = B(*loc_three)
    obj.rotation_euler = (0, 0, rot_z)
    _link(obj)
    if mat is not None:
        slot = obj.material_slots[0]
        slot.link = "OBJECT"
        slot.material = mat
    return obj


def plane(name, w_three, d_three, loc_three, mat) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    hw, hd = w_three / 2, d_three / 2
    # three-space corners (x, 0, z) → blender
    verts = [B(-hw, 0, -hd), B(hw, 0, -hd), B(hw, 0, hd), B(-hw, 0, hd)]
    mesh.from_pydata(verts, [], [[0, 1, 2, 3]])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = B(*loc_three)
    mesh.materials.append(mat)
    _link(obj)
    return obj


def build_set(cfg: dict) -> dict:
    s = cfg["set"]
    t = cfg["tuning"]
    counts = {"objects": 0}

    def count(_obj):
        counts["objects"] += 1
        return _obj

    # --- materials (shared) --------------------------------------------------
    m_ground = materials.simple("ground", "#15110d", roughness=0.96)
    m_asphalt = materials.wet_asphalt("asphalt", s)
    m_kerb_r = materials.simple("kerb-red", "#b3271e", roughness=0.55)
    m_kerb_w = materials.simple("kerb-white", "#dde3e6", roughness=0.55)
    m_wall = materials.simple("concrete", "#c9c3b6", roughness=0.92)
    m_rail = materials.simple("armco", "#c8ccd0", roughness=0.35, metallic=0.8)
    m_post = materials.simple("post", "#5f6368", roughness=0.7, metallic=0.3)
    m_water = materials.water("harbour-water")
    # dark superstructure with a soft warm glow — NOT a white slab; the windows
    # own the skyline
    m_cabin = materials.emissive("yacht-cabin", "#6b5f4e", t["cabinEmissive"] * 0.8)
    m_mast = materials.simple("yacht-mast", "#9aa0a6", roughness=0.5, metallic=0.4)
    m_pole = materials.simple("floodlight-pole", "#2e3238", roughness=0.6, metallic=0.7)
    m_head = materials.emissive("floodlight-head", "#fff2d9", t["floodlightHeadEmissive"] * 20)

    # --- ground + road -------------------------------------------------------
    count(plane("ground", 300, 300, (0, 0, 0), m_ground))
    count(plane("road", s["roadWidth"], s["roadLength"], (0, 0.01, 0), m_asphalt))

    # --- kerbs ---------------------------------------------------------------
    k = s["kerb"]
    z = s["zMin"]
    i = 0
    while z < s["zMax"]:
        colour = m_kerb_r if i % 2 == 0 else m_kerb_w
        for side in (k["x"], -k["x"]):
            count(
                box(
                    f"kerb-{side:+.0f}-{i}",
                    (k["width"], k["height"], k["seg"]),
                    (side, k["height"] / 2, z + k["seg"] / 2),
                    colour,
                )
            )
        z += k["seg"]
        i += 1

    # --- wall + armco + posts ------------------------------------------------
    length = s["zMax"] - s["zMin"]
    w = s["wall"]
    count(box("wall", (w["thickness"], w["height"], length), (w["x"], w["height"] / 2, 0), m_wall))
    a = s["armco"]
    count(box("armco", (a["width"], a["height"], length), (a["x"], a["y"], 0), m_rail))
    z = s["zMin"] + 1
    while z < s["zMax"]:
        count(box(f"post-{z:.0f}", (0.1, 0.6, 0.1), (a["x"], 0.3, z), m_post))
        z += s["postSpacing"]

    # --- buildings (rows + end closures), same scatter streams as the web ----
    bcfg = s["buildings"]
    pastels = cfg["palettes"]["pastels"]
    dusk = cfg["palettes"]["duskMasses"]
    facade_mats: dict[str, bpy.types.Material] = {}

    def facade(hex_color: str) -> bpy.types.Material:
        if hex_color not in facade_mats:
            facade_mats[hex_color] = materials.facade_windows(
                f"facade-{hex_color}", hex_color, cfg
            )
        return facade_mats[hex_color]

    def building_row(row):
        cnt = math.ceil((s["zMax"] - s["zMin"]) / row["spacing"])

        def make(r, idx):
            wdt = r.range(3, 5.5)
            d = r.range(2.5, 4.5)
            h = r.range(row["hMin"], row["hMax"])
            x = r.range(row["xMin"], row["xMax"])
            zz = s["zMin"] + (idx + 0.5) * row["spacing"] + r.range(-1.2, 1.2)
            colour = pastels[int(r.next() * len(pastels))] if r else pastels[2]
            return (x, h, zz, wdt, d, colour)

        return scatter(cnt, row["seed"], make)

    for row in bcfg["rows"]:
        for x, h, zz, wdt, d, colour in building_row(row):
            count(box(f"bld-{x:.0f}-{zz:.0f}", (wdt, h, d), (x, h / 2, zz), facade(colour)))

    def end_cluster(cluster, z_sign):
        span = cluster["xMax"] - cluster["xMin"]
        spacing = span / cluster["count"]
        seed = cluster["seed"] + (0 if z_sign > 0 else bcfg["endClusterNegSeedOffset"])

        def make(r, idx):
            wdt = r.range(spacing * 0.9, spacing * 1.25)
            d = r.range(3.5, 6.5)
            h = r.range(cluster["hMin"], cluster["hMax"])
            x = cluster["xMin"] + (idx + 0.5) * spacing
            zz = z_sign * cluster["zCenter"] + r.range(-1.5, 1.5)
            colour = dusk[int(r.next() * len(dusk))]
            return (x, h, zz, wdt, d, colour)

        return scatter(cluster["count"], seed, make)

    for cluster in bcfg["endClusters"]:
        for z_sign in (1, -1):
            for x, h, zz, wdt, d, colour in end_cluster(cluster, z_sign):
                count(
                    box(f"mass-{x:.0f}-{zz:.0f}", (wdt, h, d), (x, h / 2, zz), facade(colour))
                )

    # --- harbour: water + yachts (same seeded stream as harbour.tsx) ---------
    h = s["harbour"]
    water_w = h["waterXMax"] - h["waterXMin"]
    count(
        plane(
            "water",
            water_w,
            s["zMax"] - s["zMin"],
            ((h["waterXMin"] + h["waterXMax"]) / 2, h["waterY"], 0),
            m_water,
        )
    )
    hulls = cfg["palettes"]["hullColors"]
    hull_mats = {c: materials.simple(f"hull-{c}", c, roughness=0.32, metallic=0.1) for c in set(hulls)}

    def make_yacht(r, idx):
        beam = r.range(2.4, 3.2)
        hull_h = r.range(1.1, 1.5)
        length_ = r.range(7, 12)
        x = r.range(h["yachtXMin"], h["yachtXMax"])
        span = (s["zMax"] - s["zMin"]) / h["yachtCount"]
        zc = s["zMin"] + (idx + 0.5) * span + r.range(-1.4, 1.4)
        hull_cy = h["waterY"] + hull_h / 2 - 0.3
        deck = hull_cy + hull_h / 2
        cabin_h = r.range(1.2, 1.9)
        cabin_len = length_ * r.range(0.4, 0.5)
        cabin_z = zc - length_ * 0.12
        mast_h = r.range(8, 13)
        mast_z = zc + length_ * r.range(-0.1, 0.1)
        return (idx, beam, hull_h, length_, x, zc, hull_cy, deck, cabin_h, cabin_len, cabin_z, mast_h, mast_z)

    for (idx, beam, hull_h, length_, x, zc, hull_cy, deck, cabin_h, cabin_len, cabin_z, mast_h, mast_z) in scatter(
        h["yachtCount"], h["yachtSeed"], make_yacht
    ):
        hull_mat = hull_mats[hulls[idx % len(hulls)]]
        count(box(f"hull-{idx}", (beam, hull_h, length_), (x, hull_cy, zc), hull_mat))
        count(box(f"cabin-{idx}", (beam * 0.66, cabin_h, cabin_len), (x, deck + cabin_h / 2, cabin_z), m_cabin))
        count(box(f"mast-{idx}", (0.09, mast_h, 0.09), (x, deck + mast_h / 2, mast_z), m_mast))

    # --- floodlight masts + heads + REAL spot pools ---------------------------
    f = s["floodlights"]
    z = f["zMin"]
    while z <= f["zMax"]:
        count(
            box(
                f"pole-{z:.0f}",
                (0.14, f["topY"] - f["baseY"], 0.14),
                (f["mastX"], (f["baseY"] + f["topY"]) / 2, z),
                m_pole,
            )
        )
        head = count(
            box(f"head-{z:.0f}", (0.55, 0.16, 0.34), (f["headX"], f["headY"], z), m_head)
        )
        head.rotation_euler = (0, -f["headTilt"], 0)  # tilt about blender-Y (three-z axis)
        # one real spot per mast — Cycles path-traces the pools + haze shafts
        light = bpy.data.lights.new(f"spot-{z:.0f}", type="SPOT")
        light.energy = t["floodlightPoolIntensity"] * 6
        light.color = (1.0, 0.87, 0.72)
        light.spot_size = 1.0
        light.spot_blend = 0.5
        light.shadow_soft_size = 0.35
        lo = bpy.data.objects.new(f"spot-{z:.0f}", light)
        lo.location = B(f["headX"] - 0.1, f["headY"], z)
        # aim just past the racing line toward the camera side, so the wet
        # asphalt throws grazing specular streaks back at the trackside lens
        target = mathutils.Vector(B(-1.2, 0.0, z))
        pos = mathutils.Vector(lo.location)
        lo.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
        _link(lo)
        counts["objects"] += 1
        z += f["spacing"]

    # --- moon + world sky ------------------------------------------------------
    # Real moonlight is ~0.003–0.01 W/m²; anything near 1 W/m² reads as
    # daylight under AgX. Keep the moon a whisper — the windows, heads and
    # spot pools ARE the night's light.
    sun = bpy.data.lights.new("moon", type="SUN")
    sun.energy = t["moonIntensity"] * 0.06
    sun.color = (0.62, 0.72, 0.95)
    sun.angle = 0.03
    so = bpy.data.objects.new("moon", sun)
    so.location = B(-30, 40, 20)
    so.rotation_euler = (
        (mathutils.Vector((0, 0, 0)) - mathutils.Vector(B(-30, 40, 20)))
        .to_track_quat("-Z", "Y")
        .to_euler()
    )
    _link(so)
    counts["objects"] += 1

    _build_world_sky(cfg)
    _build_fog(cfg)
    counts["objects"] += 1  # fog domain
    return counts


def _build_world_sky(cfg: dict) -> None:
    from lib.config import srgb255_to_linear

    pal = cfg["palettes"]["nightHarbour"]
    world = bpy.context.scene.world or bpy.data.worlds.new("night")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = cfg["tuning"]["envIntensity"] * 0.5
    tex = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    # map ray z (-1..1) → 0..1
    add1 = nt.nodes.new("ShaderNodeMath")
    add1.operation = "MULTIPLY_ADD"
    add1.inputs[1].default_value = 0.5
    add1.inputs[2].default_value = 0.5
    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.42
    e0.color = (*srgb255_to_linear(pal["nadir"]), 1)
    mid = ramp.color_ramp.elements.new(0.5)
    mid.color = (*srgb255_to_linear(pal["horizon"]), 1)
    ramp.color_ramp.elements[-1].position = 0.75
    ramp.color_ramp.elements[-1].color = (*srgb255_to_linear(pal["zenith"]), 1)
    nt.links.new(tex.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], add1.inputs[0])
    nt.links.new(add1.outputs[0], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def _build_fog(cfg: dict) -> None:
    """A volume domain over the set: night haze + floodlight shafts."""
    mesh = bpy.data.meshes.new("fog-domain")
    import bmesh

    b = bmesh.new()
    bmesh.ops.create_cube(b, size=1.0)
    b.to_mesh(mesh)
    b.free()
    obj = bpy.data.objects.new("fog-domain", mesh)
    obj.scale = (120, 170, 30)  # blender: x, y(=three z), z(height)
    obj.location = (10, 0, 14.5)
    mat = bpy.data.materials.new("fog")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = 0.0065
    vol.inputs["Anisotropy"].default_value = 0.55
    vol.inputs["Color"].default_value = (0.12, 0.13, 0.18, 1)
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    mesh.materials.append(mat)
    bpy.context.scene.collection.objects.link(obj)
