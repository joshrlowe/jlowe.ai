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
from lib.rail import CentripetalCatmullRom
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


def road_ribbon(cfg: dict, mat: bpy.types.Material) -> bpy.types.Object:
    """Asphalt along the ENTIRE drive loop (the drone-follow camera sees the
    return leg too — a straight-only road plane would strand the pack on bare
    ground back there). A closed triangle-strip ribbon extruded from the rail
    curve at road width."""
    curve = CentripetalCatmullRom(cfg["railPoints"])
    half = cfg["set"]["roadWidth"] / 2
    n = 480
    verts = []
    for i in range(n):
        u = i / n
        px, _, pz = curve.point_at(u)
        tx, _, tz = curve.tangent_at(u)
        sx, sz = tz, -tx
        ln = math.hypot(sx, sz) or 1.0
        sx, sz = sx / ln, sz / ln
        verts.append(B(px + sx * half, 0.01, pz + sz * half))
        verts.append(B(px - sx * half, 0.01, pz - sz * half))
    faces = []
    for i in range(n):
        a = 2 * i
        b = 2 * i + 1
        c = (2 * i + 2) % (2 * n)
        d = (2 * i + 3) % (2 * n)
        faces.append([a, b, d, c])
    mesh = bpy.data.meshes.new("road-ribbon")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("road-ribbon", mesh)
    mesh.materials.append(mat)
    _link(obj)
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
    m_kerb_w = materials.simple("kerb-white", "#b9bdc2", roughness=0.55)
    m_wall = materials.simple("concrete", "#c9c3b6", roughness=0.92)
    m_rail = materials.simple("armco", "#c8ccd0", roughness=0.35, metallic=0.8)
    m_post = materials.simple("post", "#5f6368", roughness=0.7, metallic=0.3)
    m_water = materials.water("harbour-water")
    # dark superstructure with a whisper of glow — under the white flood rig
    # anything pale reads as a slab
    m_cabin = materials.emissive("yacht-cabin", "#3a3f45", t["cabinEmissive"] * 0.4)
    m_mast = materials.simple("yacht-mast", "#9aa0a6", roughness=0.5, metallic=0.4)
    m_pole = materials.simple("floodlight-pole", "#2e3238", roughness=0.6, metallic=0.7)
    m_head = materials.emissive("floodlight-head", "#fff2d9", t["floodlightHeadEmissive"] * 20)

    # --- ground + road -------------------------------------------------------
    count(plane("ground", 300, 300, (0, 0, 0), m_ground))
    count(road_ribbon(cfg, m_asphalt))

    # --- kerbs: red/white dashes along the FULL loop (the drone sees every
    # metre of it), tangent-aligned via the same rail curve as the road ribbon
    k = s["kerb"]
    kerb_curve = CentripetalCatmullRom(cfg["railPoints"])
    kerb_lat = s["roadHalfWidth"] - 0.3
    n_dash = int(kerb_curve.length)  # ~1 m dashes
    for i in range(n_dash):
        u = i / n_dash
        px, _, pz = kerb_curve.point_at(u)
        tx, _, tz = kerb_curve.tangent_at(u)
        ln = math.hypot(tx, tz) or 1.0
        sx, sz = tz / ln, -tx / ln
        yaw = math.atan2(tx, tz)
        colour = m_kerb_r if i % 2 == 0 else m_kerb_w
        for lat in (kerb_lat, -kerb_lat):
            count(
                box(
                    f"kerb-{i}-{lat:+.1f}",
                    (k["width"], k["height"], 1.05),
                    (px + sx * lat, k["height"] / 2, pz + sz * lat),
                    colour,
                    rot_z=-yaw,
                )
            )

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
    look = cfg["video"].get("look", {})
    pastels = look.get("towerPalette", cfg["palettes"]["pastels"])
    dusk = cfg["palettes"]["duskMasses"]
    win_cool = tuple(look.get("windowCool", (1.0, 0.62, 0.28)))
    win_warm = tuple(look.get("windowWarm", (1.0, 0.62, 0.28)))
    warm_every = look.get("warmEvery", 0)
    facade_mats: dict[tuple, bpy.types.Material] = {}
    facade_counter = {"i": 0}

    def facade(hex_color: str) -> bpy.types.Material:
        # a deterministic warm minority among the cool towers keeps the
        # skyline alive without breaking the Abu-Dhabi white-light read
        facade_counter["i"] += 1
        warm = warm_every > 0 and facade_counter["i"] % warm_every == 0
        key = (hex_color, warm)
        if key not in facade_mats:
            facade_mats[key] = materials.facade_windows(
                f"facade-{hex_color}-{'warm' if warm else 'cool'}",
                hex_color,
                cfg,
                win_warm if warm else win_cool,
            )
        return facade_mats[key]

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
    # Abu-Dhabi rig: cool WHITE light, denser spacing, masts on BOTH sides of
    # the straight, plus lights around the return leg — the drone-follow shot
    # sees the whole loop, and Yas-style circuits are lit end to end.
    f = s["floodlights"]
    flood_rgb = tuple(look.get("floodColor", (1.0, 0.87, 0.72)))
    flood_energy = t["floodlightPoolIntensity"] * look.get("floodEnergyScale", 6)
    spacing = look.get("floodSpacing", f["spacing"])

    def mast(mx: float, hx: float, z_pos: float, aim_x: float, tag: str) -> None:
        count(
            box(
                f"pole-{tag}",
                (0.14, f["topY"] - f["baseY"], 0.14),
                (mx, (f["baseY"] + f["topY"]) / 2, z_pos),
                m_pole,
            )
        )
        head = count(
            box(f"head-{tag}", (0.55, 0.16, 0.34), (hx, f["headY"], z_pos), m_head)
        )
        tilt = -f["headTilt"] if hx < mx else f["headTilt"]
        head.rotation_euler = (0, tilt, 0)
        light = bpy.data.lights.new(f"spot-{tag}", type="SPOT")
        light.energy = flood_energy
        light.color = flood_rgb
        light.spot_size = 1.05
        light.spot_blend = 0.55
        light.shadow_soft_size = 0.35
        lo = bpy.data.objects.new(f"spot-{tag}", light)
        lo.location = B(hx, f["headY"], z_pos)
        target = mathutils.Vector(B(aim_x, 0.0, z_pos))
        pos = mathutils.Vector(lo.location)
        lo.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
        _link(lo)
        counts["objects"] += 1

    z = f["zMin"]
    side = 0
    while z <= f["zMax"]:
        # stagger: even masts on the harbour side, odd on the grandstand side
        if side % 2 == 0:
            mast(f["mastX"], f["headX"], z, -1.2, f"r{z:.0f}")
        else:
            mast(-f["mastX"], -f["headX"], z, 1.2, f"l{z:.0f}")
        side += 1
        z += spacing

    # return-leg lighting: masts on the outer edge of the loop, aimed inward
    if look.get("returnFloodUs"):
        ribbon_curve = CentripetalCatmullRom(cfg["railPoints"])
        for i, u in enumerate(look["returnFloodUs"]):
            for u_side in (u, 1.0 - u):  # both halves of the teardrop
                px, _, pz = ribbon_curve.point_at(u_side)
                tx, _, tz = ribbon_curve.tangent_at(u_side)
                sx, sz = tz, -tx
                ln = math.hypot(sx, sz) or 1.0
                ox, oz = px + sx / ln * 6.5, pz + sz / ln * 6.5
                count(
                    box(
                        f"pole-ret-{i}-{u_side:.2f}",
                        (0.14, f["topY"] - f["baseY"], 0.14),
                        (ox, (f["baseY"] + f["topY"]) / 2, oz),
                        m_pole,
                    )
                )
                light = bpy.data.lights.new(f"spot-ret-{i}-{u_side:.2f}", type="SPOT")
                light.energy = flood_energy
                light.color = flood_rgb
                light.spot_size = 1.2
                light.spot_blend = 0.6
                lo = bpy.data.objects.new(f"spot-ret-{i}-{u_side:.2f}", light)
                lo.location = B(ox, f["headY"], oz)
                target = mathutils.Vector(B(px, 0.0, pz))
                pos = mathutils.Vector(lo.location)
                lo.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
                _link(lo)
                counts["objects"] += 1

    # outer-arc skyline behind the return leg — the drone faces it for the
    # whole back half of the loop; without it the return is open void
    sky_cfg = look.get("returnSkyline")
    if sky_cfg:
        cnt = math.ceil((sky_cfg["zMax"] - sky_cfg["zMin"]) / sky_cfg["spacing"])

        def make_tower(r, idx):
            w = r.range(4.5, 7.5)
            d = r.range(3.5, 6)
            hh = r.range(sky_cfg["hMin"], sky_cfg["hMax"])
            x = r.range(sky_cfg["xMin"], sky_cfg["xMax"])
            zz = sky_cfg["zMin"] + (idx + 0.5) * sky_cfg["spacing"] + r.range(-1.5, 1.5)
            colour = pastels[int(r.next() * len(pastels))]
            return (x, hh, zz, w, d, colour)

        for x, hh, zz, w, d, colour in scatter(cnt, sky_cfg["seed"], make_tower):
            count(box(f"sky-{zz:.0f}", (w, hh, d), (x, hh / 2, zz), facade(colour)))

    _build_grandstand(cfg, counts, count)
    _build_landmark(cfg, counts, count)
    _build_corner_fill(cfg, counts, count)

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


def _build_grandstand(cfg: dict, counts: dict, count) -> None:
    """Left-side dressing for the drone frame: a dark grandstand band with a
    white light strip, plus LED ad boards hugging the left road edge — the
    camera-side used to be deliberately empty (the old trackside camera never
    saw it); the drone sees both sides."""
    look = cfg["video"].get("look", {})
    g = look.get("grandstand")
    if not g:
        return
    m_stand = materials.simple("grandstand", "#20242c", roughness=0.85)
    m_strip = materials.emissive("stand-strip", "#eef4ff", 3.5)
    m_board = materials.emissive("led-board", "#cfe6ff", 3.5)

    cnt = math.ceil((g["zMax"] - g["zMin"]) / g["spacing"])

    def make(r, idx):
        w = r.range(5, 8)
        d = r.range(2.5, 4)
        h = r.range(g["hMin"], g["hMax"])
        x = r.range(g["xMin"], g["xMax"])
        zz = g["zMin"] + (idx + 0.5) * g["spacing"] + r.range(-1.0, 1.0)
        return (x, h, zz, w, d)

    for x, h, zz, w, d in scatter(cnt, g["seed"], make):
        count(box(f"stand-{zz:.0f}", (d, h, w), (x, h / 2, zz), m_stand))
        count(
            box(f"strip-{zz:.0f}", (0.2, 0.14, w * 0.9), (x + d / 2, h, zz), m_strip)
        )

    # LED boards along the left road edge — the Yas-style glowing track lining
    step = look.get("adBoardZStep", 9)
    zb = cfg["set"]["zMin"] + 2
    while zb < cfg["set"]["zMax"] - 2:
        count(
            box(f"board-{zb:.0f}", (0.12, 0.7, 3.2), (-5.0, 0.4, zb), m_board)
        )
        zb += step


def _build_landmark(cfg: dict, counts: dict, count) -> None:
    """The glowing lattice-shell landmark at the far U-turn — the drone rounds
    the corner and it fills the frame, the 'this is Abu Dhabi' beat. A dark
    glass dome under an emissive wireframe shell."""
    look = cfg["video"].get("look", {})
    lm = look.get("landmark")
    if not lm:
        return
    cx, cy, cz = lm["center"]
    r = lm["radius"]

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=48, ring_count=24, radius=1.0, location=B(cx, cy, cz)
    )
    shell = bpy.context.active_object
    shell.name = "landmark-shell"
    shell.scale = (r * 1.3, r, lm["height"] / 2)
    mod = shell.modifiers.new("lattice", "WIREFRAME")
    mod.thickness = 0.09
    m_shell = bpy.data.materials.new("landmark-glow")
    m_shell.use_nodes = True
    bsdf = m_shell.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Emission Color"].default_value = (*lm["color"], 1)
    bsdf.inputs["Emission Strength"].default_value = lm["strength"]
    shell.data.materials.append(m_shell)
    count(shell)

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32, ring_count=16, radius=1.0, location=B(cx, cy, cz)
    )
    dome = bpy.context.active_object
    dome.name = "landmark-dome"
    dome.scale = (r * 1.24, r * 0.94, lm["height"] / 2 - 0.35)
    m_dome = materials.simple("landmark-glass", "#0d1420", roughness=0.15, metallic=0.4)
    dome.data.materials.append(m_dome)
    count(dome)


def _build_corner_fill(cfg: dict, counts: dict, count) -> None:
    """A single gentle, wide soft-spot high on the OUTSIDE of the far U-turn,
    raking down across the apex. Lifts the battle pair out of silhouette where
    the return-flood pools thin at the corner — needed once the landmark
    emission was dialled down (at full strength it doubled as the corner's
    fill). Sits over the apex, aimed away from the harbour straight (x≈0), so
    it can't over-light the main straight the note protects."""
    look = cfg["video"].get("look", {})
    cf = look.get("cornerFill")
    if not cf:
        return
    px, py, pz = cf["pos"]
    ax, ay, az = cf["aim"]
    light = bpy.data.lights.new("corner-fill", type="SPOT")
    light.energy = cf["energy"]
    light.color = tuple(cf.get("color", (0.92, 0.96, 1.0)))
    light.spot_size = cf.get("spotSize", 1.5)
    light.spot_blend = cf.get("spotBlend", 0.7)
    light.shadow_soft_size = cf.get("softSize", 1.2)
    lo = bpy.data.objects.new("corner-fill", light)
    lo.location = B(px, py, pz)
    target = mathutils.Vector(B(ax, ay, az))
    pos = mathutils.Vector(lo.location)
    lo.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
    _link(lo)
    counts["objects"] += 1


def _build_world_sky(cfg: dict) -> None:
    from lib.config import srgb255_to_linear

    pal = cfg["video"].get("look", {}).get("sky", cfg["palettes"]["nightHarbour"])
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
