"""Anchorage shipyard — parametric, self-contained bpy builders for the
Lodestar Concord fleet (and its adversary), in the engineering style of
tools/cinematic/f1car.py: pure functions, station-loft cross-sections, one
shared unit-cube for every greeble, liveries as colour language only.

Ships (P0 silhouette set):
  kestrel   Kestrel-class skirmisher — trimaran hero fighter. Slim central
            fuselage, two outboard thrust booms, forward canards, single
            dorsal fin, faceted canopy ridge. Bone-white/graphite, teal
            accents, amber engine glow.
  glitch    Glitch-class drone — the Static. Irregular faceted tetra dart,
            matte void-black, one horizontal red sensor slit, flicker nozzle.
  crucible  LCV Crucible — forge-carrier flagship. REVERSED-KEEL wedge
            (deepest at the bow, keel rising to the stern), conning tower
            offset to PORT, stern forge bay glowing amber, greebled flanks,
            teal running lights, compass-star insignia.

IP-safety (checked at review, per the concept doc §8): no cruciform/S-foil
four-wing fighter; no hex-panel + ball-cockpit pairing (canopy is a faceted
ridge); the capital is NOT dagger + belly hangar + centred tower (keel is
reversed, tower is offset to port, the hangar is at the stern); original
names; colour language only, no marks.

Ship local space: nose +X, up +Z, port +Y (matches the f1car rig convention).
Units are metres: Kestrel ~14 m, Glitch ~4 m, Crucible ~420 m.

Usage (Blender's bundled Python; args after `--` are ours):

  BLENDER=~/Applications/Blender.app/Contents/MacOS/Blender
  $BLENDER -b -P tools/ships/shipyard.py -- --selftest
  $BLENDER -b -P tools/ships/shipyard.py -- --ship kestrel --angle front34
  $BLENDER -b -P tools/ships/shipyard.py -- --ship all --out /path/to/dailies

Stills land in tools/ships/out/ (git-ignored) unless --out is given.
"""

from __future__ import annotations

import argparse
import math
import os
import random
import sys

import bmesh
import bpy
import mathutils

TOOL_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# palette — colour language only, deliberately logo- and franchise-free
# ---------------------------------------------------------------------------

CONCORD = {
    "bone": "#e8e4da",  # primary hull
    "graphite": "#3a3d42",  # panel language
    "trim": "#16181c",  # dark structure / nozzle metal
    "teal": "#00c2b3",  # accent stripes + running lights
    "amber": "#ffb347",  # engine glow + forge light
    "glass": "#0c0f14",  # canopy
}

STATIC = {
    "void": "#0b0b0e",  # matte hull — reads as silhouette only
    "red": "#ee3333",  # the one sensor slit
    "ember": "#ff4433",  # dying-signal engine
}

BACKDROP = "#05060a"  # near-black studio world


# ---------------------------------------------------------------------------
# small builders (shared across all ships)
# ---------------------------------------------------------------------------


def srgb_hex_to_linear(hex_str: str) -> tuple[float, float, float]:
    h = hex_str.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin(r), lin(g), lin(b))


def _mat(name: str, hex_color: str, rough=0.5, metal=0.0, coat=0.0) -> bpy.types.Material:
    existing = bpy.data.materials.get(name)
    if existing:
        return existing
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb_hex_to_linear(hex_color), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.06
    return m


def _paint(name: str, hex_color: str) -> bpy.types.Material:
    # f1car's night lesson: high metalness mirrors a dark sky = black ships.
    # Mostly-dielectric paint under a hard clearcoat keeps hull COLOUR
    # readable on a near-black backdrop while the coat streaks the rims.
    return _mat(name, hex_color, rough=0.40, metal=0.30, coat=1.0)


def _glow(name: str, hex_color: str, strength: float) -> bpy.types.Material:
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = _mat(name, "#050505", rough=0.6)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Emission Color"].default_value = (*srgb_hex_to_linear(hex_color), 1)
    b.inputs["Emission Strength"].default_value = strength
    return m


def _link(obj: bpy.types.Object, parent: bpy.types.Object) -> bpy.types.Object:
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


def _loft(name, rings, mat, parent, cap_start=True, cap_end=True, smooth=False, bevel=0.0):
    """Bridge equal-length vertex rings into a hull. Faceted by default —
    ships here are machined, not blobby. `bevel` adds a light edge bevel so
    facet edges catch the rims."""
    n = len(rings[0])
    verts, faces = [], []
    for ring in rings:
        assert len(ring) == n, f"{name}: ragged ring"
        verts += list(ring)
    for r in range(len(rings) - 1):
        for i in range(n):
            a = r * n + i
            b = r * n + (i + 1) % n
            c = (r + 1) * n + (i + 1) % n
            d = (r + 1) * n + i
            faces.append([a, b, c, d])
    if cap_start:
        faces.append(list(range(n - 1, -1, -1)))
    if cap_end:
        faces.append(list(range((len(rings) - 1) * n, len(rings) * n)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    if smooth:
        for p in mesh.polygons:
            p.use_smooth = True
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    if bevel:
        mod = obj.modifiers.new("edge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return _link(obj, parent)


def _box(name, size, loc, mat, parent, rot=(0, 0, 0)):
    """Every greeble shares ONE unit-cube mesh (the f1car habit) — scaling +
    object-linked materials keep hundreds of panels cheap."""
    mesh = bpy.data.meshes.get("ship-unit-box")
    if mesh is None:
        mesh = bpy.data.meshes.new("ship-unit-box")
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bm.to_mesh(mesh)
        bm.free()
        mesh.materials.append(None)
    obj = bpy.data.objects.new(name, mesh)
    obj.scale = size
    obj.location = loc
    obj.rotation_euler = rot
    _link(obj, parent)
    slot = obj.material_slots[0]
    slot.link = "OBJECT"
    slot.material = mat
    return obj


def _blade(name, quad, thickness, mat, parent, axis="y", bevel=0.0):
    """A thin prism from a 4-corner outline — fins, canards, pylons.
    axis='y': quad is [(x, z), ...] extruded ±thickness/2 in y.
    axis='z': quad is [(x, y), ...] extruded in z."""
    verts = []
    for u, v in quad:
        for s in (-thickness / 2, thickness / 2):
            if axis == "y":
                verts.append((u, s, v))
            else:
                verts.append((u, v, s))
    faces = [
        [0, 2, 4, 6],
        [7, 5, 3, 1],
        [0, 1, 3, 2],
        [2, 3, 5, 4],
        [4, 5, 7, 6],
        [6, 7, 1, 0],
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    if bevel:
        mod = obj.modifiers.new("edge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return _link(obj, parent)


def _cyl_x(name, x0, x1, r, yz, mat, parent, verts=12):
    """A cylinder along +X between x0..x1 at (y, z) — nozzles, masts."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=abs(x1 - x0))
    obj = bpy.context.active_object
    obj.name = name
    obj.location = ((x0 + x1) / 2, yz[0], yz[1])
    obj.rotation_euler = (0, math.pi / 2, 0)
    obj.parent = parent
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat
    return obj


def _cyl_z(name, z0, z1, r, xy, mat, parent, verts=10):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=abs(z1 - z0))
    obj = bpy.context.active_object
    obj.name = name
    obj.location = (xy[0], xy[1], (z0 + z1) / 2)
    obj.parent = parent
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat
    return obj


# ---------------------------------------------------------------------------
# Kestrel-class skirmisher — the hero fighter (~14 m, trimaran)
# ---------------------------------------------------------------------------

# central fuselage stations: (x, half_width, height, z_center)
_KESTREL_STATIONS = [
    (7.0, 0.06, 0.08, 0.00),  # needle nose tip
    (5.8, 0.24, 0.32, 0.02),
    (4.4, 0.44, 0.56, 0.06),  # canard root zone
    (2.8, 0.62, 0.82, 0.10),  # cockpit front
    (1.0, 0.74, 0.96, 0.12),
    (-1.0, 0.76, 0.90, 0.10),
    (-3.0, 0.70, 0.80, 0.08),
    (-4.8, 0.55, 0.62, 0.05),
    (-6.2, 0.30, 0.38, 0.02),  # clean tapered tail — thrust lives on the booms
]

# faceted octagon profile: (y_frac of half_width, z_frac of height), CCW.
# Narrow flat top ridge, hard shoulder chine, tucked belly — angular, fast.
_KESTREL_PROFILE = [
    (1.00, -0.10),
    (0.92, 0.22),
    (0.30, 0.50),
    (-0.30, 0.50),
    (-0.92, 0.22),
    (-1.00, -0.10),
    (-0.55, -0.50),
    (0.55, -0.50),
]

_KESTREL_BOOM = dict(y=1.75, z=0.10, nose=3.2, tail=-6.7, r=0.44)


def _kestrel_fuselage(parent):
    rings = []
    for x, hw, h, zc in _KESTREL_STATIONS:
        rings.append([(x, fy * hw, zc + fz * h) for fy, fz in _KESTREL_PROFILE])
    return _loft("kestrel-fuselage", rings, _paint("concord-bone", CONCORD["bone"]), parent, bevel=0.03)


def _kestrel_canopy(parent):
    # angular faceted ridge — a trapezoid loft, deliberately NOT a bubble
    glass = _mat("concord-glass", CONCORD["glass"], rough=0.12, metal=0.1, coat=1.0)
    stations = [  # (x, half_w_bottom, half_w_top, z_bottom, z_top)
        (3.10, 0.20, 0.10, 0.48, 0.52),
        (2.40, 0.34, 0.16, 0.50, 0.86),
        (1.40, 0.38, 0.18, 0.52, 0.94),
        (0.30, 0.36, 0.16, 0.52, 0.80),
        (-0.60, 0.30, 0.13, 0.50, 0.58),
    ]
    rings = []
    for x, wb, wt, zb, zt in stations:
        rings.append([(x, wb, zb), (x, wt, zt), (x, -wt, zt), (x, -wb, zb)])
    return _loft("kestrel-canopy", rings, glass, parent, bevel=0.02)


def _kestrel_booms(parent):
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    trim = _mat("concord-trim", CONCORD["trim"], rough=0.35, metal=0.6)
    burn = _glow("concord-engine", CONCORD["amber"], 16)
    b = _KESTREL_BOOM
    n = 8
    for side in (1, -1):
        y = side * b["y"]
        rings = []
        for x, r in (
            (b["nose"], 0.04),
            (b["nose"] - 0.7, 0.26),
            (1.2, 0.42),
            (-2.5, b["r"]),
            (-5.2, 0.42),
            (b["tail"], 0.34),
        ):
            ring = []
            for i in range(n):
                a = 2 * math.pi * (i + 0.5) / n  # offset → flat top facet
                ring.append((x, y + r * math.cos(a), b["z"] + r * math.sin(a)))
            rings.append(ring)
        _loft(f"kestrel-boom{'P' if side > 0 else 'S'}", rings, graphite, parent, bevel=0.03)
        # nozzle: dark flare ring; the amber burn disc pokes PAST its end cap
        # so the glow actually reads from behind
        _cyl_x("kestrel-nozzle", b["tail"] - 0.02, b["tail"] - 0.55, 0.30, (y, b["z"]), trim, parent)
        _cyl_x("kestrel-burn", b["tail"] - 0.35, b["tail"] - 0.68, 0.26, (y, b["z"]), burn, parent)
        # teal accent stripe half-buried in the outboard flank
        _box(
            "kestrel-boom-stripe",
            (4.6, 0.05, 0.10),
            (-1.6, y + side * b["r"] * 0.88, b["z"] + 0.10),
            _paint("concord-teal", CONCORD["teal"]),
            parent,
        )
        # intake scoop sunk into the boom prow shoulder
        _box("kestrel-scoop", (0.9, 0.30, 0.16), (1.7, y, b["z"] + 0.30), trim, parent)


def _kestrel_pylons(parent):
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    b = _KESTREL_BOOM
    for side in (1, -1):
        # main swept blade: fuselage shoulder → boom, trailing back
        quad = [(-0.6, 0.55), (-2.6, 0.55), (-3.3, b["y"]), (-1.8, b["y"])]
        _blade(
            f"kestrel-pylon{'P' if side > 0 else 'S'}",
            [(x, side * y) for x, y in quad],
            0.12,
            graphite,
            parent,
            axis="z",
            bevel=0.02,
        )
        # thin forward strut keeps the trimaran braced
        _blade(
            "kestrel-strut",
            [(1.9, side * 0.60), (1.35, side * 0.60), (0.9, side * b["y"]), (1.45, side * b["y"])],
            0.07,
            graphite,
            parent,
            axis="z",
        )
    # pylon blades are built about z=0 — lift them level with the boom line
    for o in parent.children:
        if o.name.startswith(("kestrel-pylon", "kestrel-strut")):
            o.location.z += b["z"]


def _kestrel_canards(parent):
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    for side in (1, -1):
        quad = [(5.0, 0.35), (4.2, 0.35), (3.55, 1.38), (4.3, 1.38)]
        c = _blade(
            f"kestrel-canard{'P' if side > 0 else 'S'}",
            [(x, side * y) for x, y in quad],
            0.06,
            graphite,
            parent,
            axis="z",
            bevel=0.015,
        )
        c.location.z = 0.18
        c.rotation_euler.x = side * -0.10  # slight anhedral droop


def _kestrel_fin(parent):
    bone = _paint("concord-bone", CONCORD["bone"])
    teal = _paint("concord-teal", CONCORD["teal"])
    # single dorsal fin, swept hard back (root buried in the tail deck)
    quad = [(-3.4, 0.20), (-5.9, 0.20), (-6.6, 1.75), (-5.5, 1.75)]
    _blade("kestrel-fin", quad, 0.07, bone, parent, axis="y", bevel=0.015)
    _box("kestrel-fin-stripe", (0.16, 0.085, 1.15), (-5.85, 0, 1.05), teal, parent, rot=(0, -0.48, 0))


def _kestrel_greebles(parent):
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    trim = _mat("concord-trim", CONCORD["trim"], rough=0.35, metal=0.6)
    # graphite shoulder panels break up the bone hull
    _box("kestrel-panel-spine", (2.6, 0.34, 0.06), (-2.2, 0, 0.52), graphite, parent)
    for side in (1, -1):
        _box("kestrel-panel-chine", (2.2, 0.06, 0.26), (2.6, side * 0.60, 0.12), graphite, parent)
        _box("kestrel-rcs", (0.22, 0.10, 0.10), (5.6, side * 0.20, 0.14), trim, parent)
    _box("kestrel-keel", (3.4, 0.22, 0.08), (0.2, 0, -0.40), graphite, parent)
    _box("kestrel-antenna", (0.35, 0.03, 0.03), (-3.0, 0.25, 0.55), trim, parent, rot=(0, -0.5, 0))


def build_kestrel() -> bpy.types.Object:
    holder = bpy.data.objects.new("ship-kestrel", None)
    bpy.context.scene.collection.objects.link(holder)
    _kestrel_fuselage(holder)
    _kestrel_canopy(holder)
    _kestrel_booms(holder)
    _kestrel_pylons(holder)
    _kestrel_canards(holder)
    _kestrel_fin(holder)
    _kestrel_greebles(holder)
    return holder


# ---------------------------------------------------------------------------
# Glitch-class drone — the Static (~4 m, faceted dart)
# ---------------------------------------------------------------------------


def build_glitch() -> bpy.types.Object:
    holder = bpy.data.objects.new("ship-glitch", None)
    bpy.context.scene.collection.objects.link(holder)
    void = _mat("static-void", STATIC["void"], rough=0.85, metal=0.05)
    # low strengths: saturated red must stay RED through AgX, not blow white
    slit = _glow("static-slit", STATIC["red"], 2.5)
    ember = _glow("static-ember", STATIC["ember"], 6)

    # irregular pentagonal mid-ring, chisel-truncated prow, offset tail spike —
    # a shard, not a platonic solid. The blunt prow face exists so the sensor
    # slit can cross it as ONE band (a needle tip would split it in two).
    ring = [
        (0.20, 0.88, 0.16),
        (0.10, 0.30, 0.78),
        (0.34, -0.48, 0.62),
        (0.16, -0.84, -0.24),
        (0.28, 0.08, -0.72),
    ]
    tail = (-1.70, 0.12, 0.06)
    nose_x, tip_c, tip_s = 1.90, (0.0, 0.04), 0.45
    front = [(nose_x, tip_c[0] + tip_s * y, tip_c[1] + tip_s * z) for _, y, z in ring]
    verts = front + [(x, y, z) for x, y, z in ring] + [tail]
    faces = [[4, 3, 2, 1, 0]]  # chisel prow cap
    for i in range(5):
        faces.append([i, (i + 1) % 5, 5 + (i + 1) % 5, 5 + i])
        faces.append([10, 5 + (i + 1) % 5, 5 + i])
    mesh = bpy.data.meshes.new("glitch-hull")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(void)
    hull = bpy.data.objects.new("glitch-hull", mesh)
    mod = hull.modifiers.new("facet", "BEVEL")
    mod.width = 0.07
    mod.segments = 2
    _link(hull, holder)

    # two small asymmetric shard fins — silhouette bite, not wings
    _blade("glitch-shard-a", [(-0.3, 0.45), (-1.05, 0.32), (-1.45, 0.85), (-1.0, 0.80)], 0.05, void, holder, axis="y")
    _blade("glitch-shard-b", [(0.0, -0.45), (-0.75, -0.40), (-1.1, -0.85), (-0.7, -0.90)], 0.05, void, holder, axis="y")

    # THE feature: one horizontal red sensor slit INSET flush across the
    # chisel face — ends die into the side bevels instead of flying free
    _box("glitch-slit", (0.16, 0.72, 0.09), (1.84, 0.0, 0.10), slit, holder)

    # dying-signal engine: nozzle sunk into the tail, ember disc poking out
    trim = _mat("static-trim", "#131317", rough=0.5, metal=0.4)
    _cyl_x("glitch-nozzle", -1.15, -1.80, 0.16, (0.11, 0.06), trim, holder, verts=8)
    _cyl_x("glitch-ember", -1.68, -1.88, 0.11, (0.11, 0.06), ember, holder, verts=8)
    return holder


# ---------------------------------------------------------------------------
# LCV Crucible — forge-carrier flagship (~420 m, reversed-keel wedge)
# ---------------------------------------------------------------------------

# hull stations, bow → stern: (x, deck_hw, chine_hw, z_deck, z_chine, z_keel)
# The keel is DEEPEST near the bow and rises toward the stern — the deliberate
# inversion of the classic dagger. Plan tapers to a blunt prow, not a point.
_CRUCIBLE_STATIONS = [
    (210, 5, 8, 8, -4, -18),  # blunt prow
    (175, 17, 26, 12, -2, -44),
    (125, 30, 40, 14, 0, -56),  # deepest keel — the forge's gravity is forward
    (60, 36, 45, 15, 2, -48),
    (0, 38, 46, 16, 3, -38),
    (-75, 38, 44, 16, 4, -26),
    (-145, 36, 42, 17, 5, -15),
    (-205, 31, 37, 18, 6, -7),  # stern — keel almost surfaced
]


def _crucible_ring(x, dw, cw, zd, zc, zk):
    kw = max(0.14 * cw, 1.0)
    cw2 = 0.78 * cw
    zc2 = zc + 0.55 * (zk - zc)
    return [
        (x, cw, zc),
        (x, dw, zd),
        (x, -dw, zd),
        (x, -cw, zc),
        (x, -cw2, zc2),
        (x, -kw, zk),
        (x, kw, zk),
        (x, cw2, zc2),
    ]


def _crucible_interp(x):
    s = _CRUCIBLE_STATIONS
    x = min(max(x, s[-1][0] + 1), s[0][0] - 1)
    for i in range(len(s) - 1):
        x0, x1 = s[i][0], s[i + 1][0]
        if x1 <= x <= x0:
            t = (x0 - x) / (x0 - x1)
            return [s[i][j] + t * (s[i + 1][j] - s[i][j]) for j in range(1, 6)]
    return list(s[-1][1:])


def _crucible_hull(parent):
    bone = _paint("concord-bone", CONCORD["bone"])
    rings = [_crucible_ring(*st) for st in _CRUCIBLE_STATIONS]
    hull = _loft("crucible-hull", rings, bone, parent, smooth=True, bevel=0.8)
    # smooth within plates, hard at the chines — kills the long-quad
    # triangulation banding on the keel without blobbing the profile
    split = hull.modifiers.new("split", "EDGE_SPLIT")
    split.split_angle = math.radians(38)
    return hull


def _crucible_spine(parent):
    # dorsal spine ridge — the scan corridor of the concept doc. Tilted a
    # touch nose-down so it rides the deck, which rises toward the stern.
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    _box("crucible-spine", (270, 9, 5), (30, 0, 18.5), graphite, parent, rot=(0, 0.015, 0))
    _box("crucible-spine-top", (150, 5, 3), (0, 0, 22), graphite, parent)
    teal = _glow("concord-running", CONCORD["teal"], 5)
    _box("crucible-spine-light", (140, 0.7, 0.7), (0, 0, 23.55), teal, parent)


def _crucible_tower(parent):
    # asymmetric conning tower, offset to PORT (+y), stepped aft
    bone = _paint("concord-bone", CONCORD["bone"])
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    windows = _glow("concord-window", CONCORD["teal"], 10)
    trim = _mat("concord-trim", CONCORD["trim"], rough=0.35, metal=0.6)
    x, y = -100, 19
    _box("tower-base", (46, 22, 9), (x, y - 2, 20), graphite, parent)
    _box("tower-mid", (30, 15, 10), (x - 4, y + 1, 29), bone, parent)
    _box("tower-bridge", (18, 11, 7), (x - 8, y + 3, 37), bone, parent)
    _box("tower-cap", (10, 7, 3), (x - 10, y + 4, 42), graphite, parent)
    # bridge glazing: teal strip on the forward + port faces
    _box("tower-glass-f", (0.6, 9, 1.4), (x + 1.2, y + 3, 38.2), windows, parent)
    _box("tower-glass-p", (14, 0.6, 1.2), (x - 8, y + 8.7, 38.2), windows, parent)
    _cyl_z("tower-mast", 43.5, 58, 0.8, (x - 12, y + 4), trim, parent)
    _cyl_z("tower-mast2", 43.5, 51, 0.5, (x - 4, y + 1), trim, parent)
    _box("tower-array", (1.2, 8, 0.7), (x - 12, y + 4, 52), trim, parent)


def _crucible_forge_bay(parent):
    """The stern forge bay — an open hangar mouth glowing warm amber.
    'Prototype in, production out.' Built as a collar vestibule PROUD of the
    stern face (the loft caps the hull, so a recess would be invisible): a
    dark rectangular frame extends aft, the amber wall glows at its throat,
    and gantry mullions silhouette against the light."""
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    trim = _mat("concord-trim", CONCORD["trim"], rough=0.35, metal=0.6)
    forge = _glow("concord-forge", CONCORD["amber"], 14)
    xs = -205  # stern face
    w, h, zc, depth = 24, 11, 8, 16  # mouth half-width, height, centre, collar depth
    cx = xs - depth / 2  # collar centreline
    _box("bay-frame-top", (depth, 2 * w + 6, 4), (cx, 0, zc + h / 2 + 2), graphite, parent)
    _box("bay-frame-bot", (depth, 2 * w + 6, 4), (cx, 0, zc - h / 2 - 2), graphite, parent)
    for side in (1, -1):
        _box("bay-frame-side", (depth, 4, h + 4), (cx, side * (w + 2), zc), graphite, parent)
    # the glow: amber wall at the throat + a floor wash running out the mouth
    _box("bay-glow-wall", (2, 2 * w - 2, h - 1), (xs - 2, 0, zc), forge, parent)
    _box("bay-glow-floor", (depth - 3, 2 * w - 4, 1), (cx, 0, zc - h / 2 + 0.7), forge, parent)
    # gantry mullions silhouetted against the glow — the hangar reads BUILT
    for i, gy in enumerate((-13, 0, 13)):
        _box(f"bay-gantry-{i}", (1.4, 1.4, h - 1), (xs - depth + 3, gy, zc), trim, parent)
    _box("bay-gantry-beam", (1.4, 2 * w - 4, 1.4), (xs - depth + 3, 0, zc + h / 2 - 1.5), trim, parent)
    # engine nozzles at the stern corners, clear of the collar — thrust, not
    # the star (and pointedly NOT a centred thruster trio)
    burn = _glow("concord-engine", CONCORD["amber"], 16)
    for side in (1, -1):
        _cyl_x("crucible-nozzle", xs + 2, xs - 7, 3.4, (side * 33, 6), trim, parent)
        _cyl_x("crucible-burn", xs - 5.5, xs - 7.5, 2.5, (side * 33, 6), burn, parent)


def _crucible_greebles(parent):
    """City-texture passes: instanced shared-mesh boxes along the flanks and
    deck. Seeded — the same Crucible every build."""
    rng = random.Random(7)
    bone = _paint("concord-bone", CONCORD["bone"])
    graphite = _paint("concord-graphite", CONCORD["graphite"])
    trim = _mat("concord-trim", CONCORD["trim"], rough=0.35, metal=0.6)

    def pick():
        # mostly hull-toned — city texture should come from SHADOW, not from
        # salt-and-pepper contrast (the round-1 lesson)
        v = rng.random()
        return bone if v < 0.55 else (graphite if v < 0.90 else trim)

    # flank bands: boxes riding the deck-edge→chine surface
    for side in (1, -1):
        for i in range(80):
            x = rng.uniform(-195, 185)
            dw, cw, zd, zc, zk = _crucible_interp(x)
            s = rng.uniform(0.10, 0.80)
            y = dw + s * (cw - dw)
            z = zd + s * (zc - zd)
            _box(
                f"greeble-f{side}-{i}",
                (rng.uniform(4, 13), rng.uniform(1.5, 3.5), rng.uniform(1.5, 4)),
                (x, side * (y + 0.8), z),
                pick(),
                parent,
            )
    # deck city: low blocks between spine and deck edge
    for i in range(45):
        x = rng.uniform(-190, 170)
        dw, cw, zd, zc, zk = _crucible_interp(x)
        y = rng.uniform(0.3, 0.8) * dw * rng.choice((1, -1))
        _box(
            f"greeble-d-{i}",
            (rng.uniform(5, 12), rng.uniform(2.5, 5), rng.uniform(1.5, 4)),
            (x, y, zd + 1.2),
            pick(),
            parent,
        )


def _crucible_lights(parent):
    # teal running-light dashes tracing the chine — the fleet's signature
    teal = _glow("concord-running", CONCORD["teal"], 5)
    for side in (1, -1):
        for i in range(13):
            x = 185 - i * 30
            dw, cw, zd, zc, zk = _crucible_interp(x)
            _box(f"run-chine-{i}", (9, 0.6, 0.6), (x, side * (cw + 0.2), zc + 0.3), teal, parent)
        for i in range(9):
            x = 160 - i * 42
            dw, cw, zd, zc, zk = _crucible_interp(x)
            _box(f"run-deck-{i}", (7, 0.5, 0.5), (x, side * (dw - 0.5), zd + 0.3), teal, parent)


def _compass_star(name, center, size, parent, flip=False):
    """The Concord insignia: four-point star in a broken ring. Flat emissive
    decal geometry, built in the x-z plane facing +y (flip for −y)."""
    mat = _glow("concord-insignia", CONCORD["bone"], 6)
    cx, cy, cz = center
    pts = []
    for i in range(4):
        a = math.pi / 2 * i
        tip = (cx + size * math.cos(a), cz + size * math.sin(a))
        ir = 0.24 * size
        il = (cx + ir * math.cos(a + math.pi / 4), cz + ir * math.sin(a + math.pi / 4))
        r = (cx + ir * math.cos(a - math.pi / 4), cz + ir * math.sin(a - math.pi / 4))
        pts.append((tip, il, r))
    verts, faces = [(cx, cy, cz)], []
    for tip, il, r in pts:
        b = len(verts)
        verts += [(tip[0], cy, tip[1]), (il[0], cy, il[1]), (r[0], cy, r[1])]
        faces.append([0, b + 2, b, b + 1] if not flip else [0, b + 1, b, b + 2])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.materials.append(mat)
    star = bpy.data.objects.new(name, mesh)
    _link(star, parent)
    # broken ring: four tangent dashes at the diagonals
    for i in range(4):
        a = math.pi / 4 + math.pi / 2 * i
        rr = 1.3 * size
        _box(
            f"{name}-ring-{i}",
            (0.55 * size, 0.5, 0.10 * size),
            (cx + rr * math.cos(a), cy, cz + rr * math.sin(a)),
            mat,
            parent,
            rot=(0, -a - math.pi / 2, 0),
        )
    return star


def build_crucible() -> bpy.types.Object:
    holder = bpy.data.objects.new("ship-crucible", None)
    bpy.context.scene.collection.objects.link(holder)
    _crucible_hull(holder)
    _crucible_spine(holder)
    _crucible_tower(holder)
    _crucible_forge_bay(holder)
    _crucible_greebles(holder)
    _crucible_lights(holder)
    # insignia — compass star in a broken ring, painted on both flat faces of
    # the conning tower. (The hull-flank version wants a real decal/texture
    # pass — deferred to the GLB phase per the P0 'skip if fiddly' brief.)
    _compass_star("insigniaP", (-104, 27.9, 29), 4.0, holder)
    _compass_star("insigniaS", (-104, 12.1, 29), 4.0, holder, flip=True)
    return holder


# ---------------------------------------------------------------------------
# studio — near-black backdrop, cool key + teal/amber rims
# ---------------------------------------------------------------------------

BUILDERS = {"kestrel": build_kestrel, "glitch": build_glitch, "crucible": build_crucible}

ANGLES = {  # unit-ish direction from subject centre toward the camera
    "front34": (1.0, -0.85, 0.42),
    "side": (0.0, -1.0, 0.10),
    "rear34": (-1.0, -0.85, 0.35),
    "top": (0.12, -0.05, 1.0),
}

# the Crucible's 3/4 shots come from the PORT side — that's where the offset
# conning tower and insignia live; the starboard side profile still documents
# the reversed keel.
ANGLE_OVERRIDES = {
    "crucible": {"front34": (1.0, 0.85, 0.42), "rear34": (-1.0, 0.85, 0.35)},
}

SHIP_ANGLES = {
    "kestrel": ["front34", "side", "rear34"],
    "glitch": ["front34", "side", "rear34"],
    "crucible": ["front34", "side", "rear34", "top"],
}


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def _bbox(holder) -> tuple[mathutils.Vector, mathutils.Vector]:
    bpy.context.view_layer.update()
    lo = mathutils.Vector((1e9, 1e9, 1e9))
    hi = -lo.copy()
    for o in holder.children_recursive:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c)
            lo = mathutils.Vector(map(min, lo, w))
            hi = mathutils.Vector(map(max, hi, w))
    return lo, hi


def _recenter(holder) -> None:
    """Move the holder so the ship's bbox centre sits at the origin."""
    lo, hi = _bbox(holder)
    holder.location -= (lo + hi) / 2


def _world() -> None:
    world = bpy.data.worlds.new("void")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        *srgb_hex_to_linear(BACKDROP),
        1,
    )
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0


def _lights(direction, radius: float, key_mult=1.0) -> None:
    """Per-SHOT rig, positioned relative to the camera axis: cool key from
    the camera's upper left, teal rim behind-left, amber rim behind-right-low.
    Rebuilt for every angle — a world-fixed rig floods whichever flank the
    camera happens to face (the round-1 lesson)."""
    for o in [o for o in bpy.context.scene.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(o, do_unlink=True)
    d = mathutils.Vector(direction).normalized()
    m = (-d).to_track_quat("-Z", "Y").to_matrix()
    rt, up = m @ mathutils.Vector((1, 0, 0)), m @ mathutils.Vector((0, 1, 0))
    r = radius
    rigs = (
        ("key", 1.1 * d - 1.0 * rt + 1.2 * up, "#dfe9ff", 110 * key_mult, 0.9),
        ("rim-teal", -1.5 * d - 1.4 * rt + 0.55 * up, "#4fd8cc", 38, 0.7),
        ("rim-amber", -1.3 * d + 1.5 * rt - 0.7 * up, "#ffb347", 24, 0.45),
        ("fill", 0.9 * d + 1.3 * rt - 0.2 * up, "#2c3644", 12, 1.2),
    )
    for name, pos, hexc, e_per_r2, size in rigs:
        light = bpy.data.lights.new(name, type="AREA")
        light.energy = e_per_r2 * r * r
        light.size = size * r
        light.color = srgb_hex_to_linear(hexc)
        lo = bpy.data.objects.new(name, light)
        lo.location = pos * r
        lo.rotation_euler = (
            (mathutils.Vector((0, 0, 0)) - lo.location).to_track_quat("-Z", "Y").to_euler()
        )
        bpy.context.scene.collection.objects.link(lo)


def _fit_camera(direction, corners, fov_y, aspect, margin=1.10):
    """Smallest distance along `direction` that fits every bbox corner in
    frame — proper per-axis projection, not a bounding-sphere guess."""
    d = mathutils.Vector(direction).normalized()
    q = (-d).to_track_quat("-Z", "Y")
    m = q.to_matrix()
    right, up, look = m @ mathutils.Vector((1, 0, 0)), m @ mathutils.Vector((0, 1, 0)), -d
    tan_y = math.tan(fov_y / 2)
    tan_x = tan_y * aspect
    dist = 0.0
    for c in corners:
        o = mathutils.Vector(c)
        depth = o.dot(look)
        dist = max(dist, abs(o.dot(right)) / tan_x - depth, abs(o.dot(up)) / tan_y - depth)
    return d * dist * margin, q


def _camera(direction, corners, aim_offset=(0, 0, 0)) -> None:
    cam = bpy.data.cameras.new("cam")
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(30)
    aspect = bpy.context.scene.render.resolution_x / bpy.context.scene.render.resolution_y
    pos, q = _fit_camera(direction, corners, cam.angle_y, aspect)
    co = bpy.data.objects.new("cam", cam)
    co.location = pos + mathutils.Vector(aim_offset)
    co.rotation_euler = q.to_euler()
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co


def _configure_render(width: int, samples: int) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for dev in prefs.devices:
        dev.use = True
    scene.cycles.device = "GPU"
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.05
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.max_bounces = 6
    scene.render.resolution_x = width
    scene.render.resolution_y = int(width * 9 / 16)
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Base Contrast"
    scene.view_settings.exposure = 0.35
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"


def tri_count(holder) -> int:
    deps = bpy.context.evaluated_depsgraph_get()
    total = 0
    for o in holder.children_recursive:
        if o.type != "MESH":
            continue
        ev = o.evaluated_get(deps)
        m = ev.to_mesh()
        m.calc_loop_triangles()
        total += len(m.loop_triangles)
        ev.to_mesh_clear()
    return total


def render_ship(ship: str, angles: list[str], out_dir: str, width: int, samples: int, save_blend: bool) -> dict:
    reset_scene()
    _configure_render(width, samples)
    holder = BUILDERS[ship]()
    _recenter(holder)
    lo, hi = _bbox(holder)
    corners = [
        (x, y, z) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)
    ]
    r = (hi - lo).length / 2
    _world()
    tris = tri_count(holder)
    stats = {"tris": tris, "paths": []}
    for angle in angles:
        direction = ANGLE_OVERRIDES.get(ship, {}).get(angle, ANGLES[angle])
        # void-black must STAY black — dim key, let the rims carve the shape
        _lights(direction, r, key_mult=0.45 if ship == "glitch" else 1.0)
        _camera(direction, corners)
        path = os.path.join(out_dir, f"{ship}-{angle}.png")
        bpy.context.scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        stats["paths"].append(path)
        print(f"[shipyard] wrote {path}")
    if save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, f"{ship}.blend"))
    return stats


def render_fleet(out_dir: str, width: int, samples: int, save_blend: bool) -> dict:
    """One composite still at true relative scale — Glitch tiny, Kestrel
    small, Crucible huge. The size language IS the shot."""
    reset_scene()
    _configure_render(width, samples)
    crucible = BUILDERS["crucible"]()
    _recenter(crucible)
    lo, hi = _bbox(crucible)
    corners = [(x, y, z) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
    r = (hi - lo).length / 2
    _world()
    # stern quarter — the forge bay glow belongs in the size-language shot
    direction = (-0.7, -1.0, 0.25)
    _lights(direction, r)
    cam = bpy.data.cameras.new("cam")
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(30)
    aspect = 16 / 9
    pos, q = _fit_camera(direction, corners, cam.angle_y, aspect, margin=1.18)
    co = bpy.data.objects.new("cam", cam)
    co.location = pos
    co.rotation_euler = q.to_euler()
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co

    # foreground pair sweeping across the stern: a Kestrel chasing a Glitch
    m = q.to_matrix()
    right, up = m @ mathutils.Vector((1, 0, 0)), m @ mathutils.Vector((0, 1, 0))
    ln = pos.length
    kestrel = BUILDERS["kestrel"]()
    _recenter(kestrel)  # keeps its own centre offset; placement adds on top
    place_k = pos * 0.52 - right * (0.11 * ln) - up * (0.038 * ln)
    kestrel.location += place_k
    kestrel.rotation_euler = (0.45, -0.06, -2.35)
    glitch = BUILDERS["glitch"]()
    _recenter(glitch)
    nose = mathutils.Vector((math.cos(-2.35), math.sin(-2.35), 0.06)).normalized()
    glitch.location += place_k + nose * 24 + pos * 0.12
    glitch.rotation_euler = (-0.3, 0.15, -2.2)

    path = os.path.join(out_dir, "fleet.png")
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"[shipyard] wrote {path}")
    if save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "fleet.blend"))
    return {"paths": [path]}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--ship", default="all", choices=[*BUILDERS, "fleet", "all"])
    ap.add_argument("--angle", default="all", choices=[*ANGLES, "all"])
    ap.add_argument("--out", default=os.path.join(TOOL_DIR, "out"))
    ap.add_argument("--width", type=int, default=960)
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--save-blend", action="store_true")
    ap.add_argument("--selftest", action="store_true", help="build all, assert, no render")
    return ap.parse_args(argv)


def selftest() -> None:
    reset_scene()
    counts = {}
    for name, build in BUILDERS.items():
        holder = build()
        counts[name] = tri_count(holder)
    assert counts["kestrel"] > 2000, counts
    assert 200 < counts["glitch"] < 6000, counts
    assert counts["crucible"] > 3000, counts
    # one shared greeble mesh only — the instancing habit holds
    unit_users = [o for o in bpy.data.objects if o.type == "MESH" and o.data.name == "ship-unit-box"]
    assert len(unit_users) > 200, len(unit_users)
    # the Glitch carries exactly one sensor slit
    slits = [o for o in bpy.data.objects if o.name.startswith("glitch-slit")]
    assert len(slits) == 1, slits
    print(f"[shipyard] selftest OK — tris: {counts}, shared-box users: {len(unit_users)}")


def main() -> None:
    args = parse_args()
    os.makedirs(args.out, exist_ok=True)
    if args.selftest:
        selftest()
        return
    import time

    ships = list(BUILDERS) + ["fleet"] if args.ship == "all" else [args.ship]
    for ship in ships:
        t0 = time.time()
        if ship == "fleet":
            stats = render_fleet(args.out, args.width, args.samples, args.save_blend)
        else:
            angles = SHIP_ANGLES[ship] if args.angle == "all" else [args.angle]
            stats = render_ship(ship, angles, args.out, args.width, args.samples, args.save_blend)
        dt = time.time() - t0
        tris = stats.get("tris", "-")
        print(f"[shipyard] {ship}: tris={tris} renders={len(stats['paths'])} in {dt:.1f}s")


if __name__ == "__main__":
    main()
