"""Parametric 2026-style open-wheeler, built entirely in bpy — the hero car
set. Replaces the 1.1k-tri CC0 placeholder with a car that reads at drone
distance: proper silhouette (needle nose, wing stacks, halo, sidepod undercut,
engine-cover fin, coke-bottle tail, diffuser), SEPARATE wheels that spin and
steer, suspension, and a helmeted driver. Liveries are colour language only —
evocative of real teams, no marks (the repo's no-real-brand-IP rule).

Car local space: nose +X, up +Z (Blender axes; matches the rig convention the
choreography bakes against). Dimensions loosely 2026-reg: ~5.5 m long, ~1.9 m
wide, 720 mm wheels.
"""

from __future__ import annotations

import math

import bmesh
import bpy
import mathutils

from lib.config import srgb_hex_to_linear

# ---------------------------------------------------------------------------
# liveries — colour language, deliberately logo-free
# ---------------------------------------------------------------------------

LIVERIES: dict[str, dict] = {
    "navy-bull": {
        "primary": "#111c3d",
        "secondary": "#1b2b5c",
        "accent": "#e03131",
        "accent2": "#ffc906",
        "helmet": "#e03131",
        "wing": "#111c3d",
    },
    "silver-arrow": {
        "primary": "#b9bfc6",
        "secondary": "#8d939b",
        "accent": "#00c2b3",
        "accent2": "#00c2b3",
        "helmet": "#f2f2f0",
        "wing": "#26292e",
    },
    "rosso": {
        "primary": "#c8102e",
        "secondary": "#a00d24",
        "accent": "#ffd800",
        "accent2": "#15161a",
        "helmet": "#ffd800",
        "wing": "#15161a",
    },
    "papaya": {
        "primary": "#ff7f1f",
        "secondary": "#1e2126",
        "accent": "#47c7fc",
        "accent2": "#1e2126",
        "helmet": "#ff7f1f",
        "wing": "#1e2126",
    },
}

# fuselage stations: (x, half_width, height, z_bottom)
_STATIONS = [
    (2.85, 0.055, 0.08, 0.20),  # drooped needle tip, reaching for the wing
    (2.35, 0.11, 0.15, 0.20),
    (1.75, 0.19, 0.24, 0.16),
    (1.25, 0.29, 0.33, 0.10),
    (0.75, 0.41, 0.45, 0.05),
    (0.25, 0.47, 0.52, 0.04),
    (-0.35, 0.44, 0.62, 0.04),
    (-1.05, 0.44, 0.56, 0.05),
    (-1.65, 0.32, 0.42, 0.10),  # engine cover holds height toward the tail…
    (-2.15, 0.14, 0.26, 0.16),  # …so the crash structure meets the wing zone
]

WHEEL = dict(
    front_x=1.62,
    rear_x=-1.72,
    track=0.80,  # |y| of wheel centre
    radius=0.36,
    width_front=0.28,
    width_rear=0.33,
)


# ---------------------------------------------------------------------------
# small builders
# ---------------------------------------------------------------------------


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
        b.inputs["Coat Roughness"].default_value = 0.05
    return m


def _paint(name: str, hex_color: str) -> bpy.types.Material:
    # night lesson: high metalness = a mirror of the dark sky = black cars.
    # Mostly-dielectric paint under a hard clearcoat keeps the livery COLOUR
    # readable under the floods while the coat still streaks highlights.
    return _mat(name, hex_color, rough=0.38, metal=0.35, coat=1.0)


def _carbon() -> bpy.types.Material:
    return _mat("f1-carbon", "#16181c", rough=0.28, metal=0.35, coat=0.7)


def _link(obj: bpy.types.Object, parent: bpy.types.Object) -> bpy.types.Object:
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


def _mesh_obj(name: str, verts, faces, mat, parent, smooth=True, subsurf=0):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    if smooth:
        for p in mesh.polygons:
            p.use_smooth = True
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    if subsurf:
        mod = obj.modifiers.new("subsurf", "SUBSURF")
        mod.levels = subsurf
        mod.render_levels = subsurf
    return _link(obj, parent)


def _box(name, size, loc, mat, parent, rot=(0, 0, 0), smooth=False):
    mesh = bpy.data.meshes.get("f1-unit-box")
    if mesh is None:
        mesh = bpy.data.meshes.new("f1-unit-box")
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


def _cyl_between(name, p1, p2, r, mat, parent):
    p1v, p2v = mathutils.Vector(p1), mathutils.Vector(p2)
    d = p2v - p1v
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=r, depth=d.length)
    obj = bpy.context.active_object
    obj.name = name
    obj.location = (p1v + p2v) / 2
    obj.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    obj.parent = parent
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat
    return obj


# ---------------------------------------------------------------------------
# components
# ---------------------------------------------------------------------------


def _fuselage(livery, parent):
    n = 14
    verts, faces = [], []
    for x, hw, h, zb in _STATIONS:
        cz = zb + h / 2
        for i in range(n):
            a = 2 * math.pi * i / n
            verts.append((x, hw * math.cos(a), cz + (h / 2) * math.sin(a)))
    rings = len(_STATIONS)
    for r in range(rings - 1):
        for i in range(n):
            a = r * n + i
            b = r * n + (i + 1) % n
            c = (r + 1) * n + (i + 1) % n
            d = (r + 1) * n + i
            faces.append([a, b, c, d])
    faces.append(list(range(n - 1, -1, -1)))  # nose cap
    faces.append(list(range((rings - 1) * n, rings * n)))  # tail cap
    return _mesh_obj(
        "body", verts, faces, _paint(f"paint-{livery['name']}", livery["primary"]), parent, subsurf=1
    )


def _sidepods(livery, parent):
    # mirrored lofts with a front inlet face left open-dark
    stations = [  # (x, y_inner, y_outer, z_bottom, z_top)
        (0.55, 0.30, 0.62, 0.10, 0.42),
        (0.10, 0.28, 0.72, 0.06, 0.46),
        (-0.60, 0.26, 0.66, 0.10, 0.38),
        (-1.35, 0.22, 0.42, 0.16, 0.26),
    ]
    mat = _paint(f"paint2-{livery['name']}", livery["secondary"])
    inlet = _mat("f1-inlet", "#07080a", rough=0.6)
    for side in (1, -1):
        verts, faces = [], []
        for x, yi, yo, zb, zt in stations:
            verts += [
                (x, side * yi, zb),
                (x, side * yo, zb),
                (x, side * yo, zt),
                (x, side * yi, zt),
            ]
        for r in range(len(stations) - 1):
            for i in range(4):
                a = r * 4 + i
                b = r * 4 + (i + 1) % 4
                c = (r + 1) * 4 + (i + 1) % 4
                d = (r + 1) * 4 + i
                faces.append([a, b, c, d] if side == 1 else [d, c, b, a])
        faces.append([3, 2, 1, 0] if side == 1 else [0, 1, 2, 3])  # inlet face
        last = (len(stations) - 1) * 4
        tailf = [last, last + 1, last + 2, last + 3]
        faces.append(tailf if side == -1 else tailf[::-1])
        pod = _mesh_obj(f"pod{'R' if side < 0 else 'L'}", verts, faces, mat, parent, subsurf=1)
        # dark inlet plate just inside the mouth
        _box(
            f"inlet{'R' if side < 0 else 'L'}",
            (0.04, (stations[0][2] - stations[0][1]) * 0.9, (stations[0][4] - stations[0][3]) * 0.8),
            (0.55, side * (stations[0][1] + stations[0][2]) / 2, (stations[0][3] + stations[0][4]) / 2),
            inlet,
            parent,
        )
    return pod


def _wing_plane(name, x, z, span, chord, mat, parent, pitch=0.18, thick=0.028):
    return _box(name, (chord, span * 2, thick), (x, 0, z), mat, parent, rot=(0, pitch, 0))


def _front_wing(livery, parent):
    carbon = _carbon()
    accent = _paint(f"accent-{livery['name']}", livery["accent"])
    _wing_plane("fw-main", 2.62, 0.12, 0.92, 0.42, carbon, parent, pitch=0.10)
    _wing_plane("fw-flap1", 2.48, 0.20, 0.88, 0.30, carbon, parent, pitch=0.30)
    _wing_plane("fw-flap2", 2.36, 0.28, 0.82, 0.22, accent, parent, pitch=0.48)
    for side in (1, -1):
        _box("fw-end", (0.50, 0.03, 0.24), (2.52, side * 0.92, 0.21), carbon, parent)
    # pylons from the nose underside down onto the main plane
    for side in (1, -1):
        _cyl_between(
            "fw-pylon", (2.70, side * 0.07, 0.22), (2.60, side * 0.10, 0.13), 0.022, carbon, parent
        )


def _rear_wing(livery, parent):
    carbon = _carbon()
    wing = _paint(f"wing-{livery['name']}", livery["wing"])
    _wing_plane("rw-main", -2.34, 0.86, 0.48, 0.34, wing, parent, pitch=0.40)
    _wing_plane("rw-flap", -2.46, 1.02, 0.46, 0.22, wing, parent, pitch=0.58)
    _wing_plane("rw-beam", -2.16, 0.46, 0.34, 0.15, carbon, parent, pitch=0.5)
    for side in (1, -1):
        # tall vertical endplates bracketing both elements
        _box("rw-end", (0.46, 0.026, 0.46), (-2.38, side * 0.50, 0.86), carbon, parent)
    # swan-neck pylon actually bridging crash structure → wing underside
    _cyl_between("rw-pylon", (-2.05, 0, 0.30), (-2.32, 0, 0.84), 0.030, carbon, parent)
    _cyl_between("rw-pylon2", (-2.05, 0, 0.30), (-2.16, 0, 0.48), 0.026, carbon, parent)
    # rear-facing livery: the drone lives BEHIND the cars, and carbon-dark
    # wings made the whole grid read black at night — stripe + endplate caps
    accent = _paint(f"accent-{livery['name']}", livery["accent"])
    accent2 = _paint(f"accent2-{livery['name']}", livery["accent2"])
    _box("rw-stripe", (0.07, 0.92, 0.045), (-2.50, 0, 1.04), accent2, parent, rot=(0, 0.58, 0))
    for side in (1, -1):
        _box("rw-endcap", (0.05, 0.036, 0.46), (-2.59, side * 0.50, 0.86), accent, parent)


def _floor(parent):
    carbon = _carbon()
    # keep the plank inside the wheels' inner faces (track 0.80 − width/2)
    _box("floor", (2.85, 1.26, 0.045), (-0.15, 0, 0.045), carbon, parent)
    _box("diffuser", (0.7, 1.0, 0.04), (-1.95, 0, 0.14), carbon, parent, rot=(0, -0.35, 0))
    for side in (1, -1):
        _box("floor-edge", (1.7, 0.05, 0.10), (-0.3, side * 0.645, 0.10), carbon, parent)


def _halo(parent):
    carbon = _carbon()
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.44, minor_radius=0.045, major_segments=28, minor_segments=8
    )
    halo = bpy.context.active_object
    halo.name = "halo"
    halo.location = (0.30, 0, 0.64)
    halo.rotation_euler = (0, 0.10, 0)
    halo.scale = (1.1, 1.0, 0.62)
    halo.parent = parent
    halo.data.materials.append(carbon)
    _cyl_between("halo-pylon", (0.74, 0, 0.42), (0.74, 0, 0.78), 0.03, carbon, parent)


def _fin_and_airbox(livery, parent):
    accent2 = _paint(f"accent2-{livery['name']}", livery["accent2"])
    fin = _box(
        "shark-fin",
        (1.15, 0.024, 0.30),
        (-1.15, 0, 0.58),
        _paint(f"paint2-{livery['name']}", livery["secondary"]),
        parent,
        rot=(0, -0.08, 0),
    )
    _box("t-cam", (0.10, 0.20, 0.07), (-0.05, 0, 0.70), accent2, parent)
    return fin


def _cockpit(livery, parent):
    dark = _mat("f1-cockpit", "#0a0b0e", rough=0.7)
    _box("cockpit-open", (0.62, 0.34, 0.10), (0.28, 0, 0.585), dark, parent)
    helmet_mat = _mat(f"helmet-{livery['name']}", livery["helmet"], rough=0.25, metal=0.2, coat=1.0)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.125)
    helmet = bpy.context.active_object
    helmet.name = "helmet"
    helmet.location = (0.22, 0, 0.60)
    helmet.parent = parent
    helmet.data.materials.append(helmet_mat)
    _box("visor", (0.06, 0.16, 0.05), (0.33, 0, 0.61), _mat("f1-visor", "#0c0d10", rough=0.1), parent)
    for side in (1, -1):
        _box("mirror", (0.05, 0.10, 0.05), (0.55, side * 0.46, 0.52), _carbon(), parent)
        _cyl_between(
            "mirror-stalk", (0.52, side * 0.36, 0.46), (0.55, side * 0.44, 0.51), 0.012, _carbon(), parent
        )


def _wheel(name, x, y, radius, width, parent, steer: bool):
    """A wheel unit: steer empty (for fronts) → spin-tagged wheel mesh."""
    tire = _mat("f1-tire", "#0b0b0d", rough=0.55)
    rim = _mat("f1-rim", "#22262c", rough=0.25, metal=1.0)
    hub_holder = bpy.data.objects.new(f"{name}-steer", None)
    hub_holder.location = (x, y, radius)
    _link(hub_holder, parent)

    # flat-tread slick: a cylinder with beveled shoulders (a torus profile can
    # never read as modern racing rubber)
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=radius, depth=width)
    wheel = bpy.context.active_object
    wheel.name = name
    wheel.rotation_euler = (math.pi / 2, 0, 0)
    bev = wheel.modifiers.new("shoulder", "BEVEL")
    bev.width = radius * 0.16
    bev.segments = 3
    wheel.location = (0, 0, 0)
    wheel.parent = hub_holder
    wheel.data.materials.append(tire)
    for p in wheel.data.polygons:
        p.use_smooth = True

    bpy.ops.mesh.primitive_cylinder_add(vertices=22, radius=radius * 0.56, depth=width * 1.02)
    cap = bpy.context.active_object
    cap.name = f"{name}-rim"
    cap.parent = wheel  # inherits the axle orientation from the tire
    cap.data.materials.append(rim)
    return hub_holder, wheel


def _suspension(parent):
    carbon = _carbon()
    w = WHEEL
    for x, tag in ((w["front_x"], "f"), (w["rear_x"], "r")):
        for side in (1, -1):
            hub = (x, side * (w["track"] - 0.16), w["radius"])
            _cyl_between(f"wb-{tag}-up", (x + 0.18, side * 0.30, 0.34), (hub[0], hub[1], hub[2] + 0.08), 0.016, carbon, parent)
            _cyl_between(f"wb-{tag}-lo", (x + 0.10, side * 0.28, 0.12), (hub[0], hub[1], hub[2] - 0.10), 0.016, carbon, parent)
            _cyl_between(f"wb-{tag}-push", (x - 0.15, side * 0.26, 0.40), (hub[0], hub[1], hub[2] - 0.04), 0.014, carbon, parent)


# ---------------------------------------------------------------------------
# public builder
# ---------------------------------------------------------------------------


def build_f1_car(index: int, livery_key: str) -> bpy.types.Object:
    """Build one car under a fresh holder (nose +X). Returns the holder; wheel
    spin meshes are named `f1-<i>-wheel-*` and front steer empties
    `f1-<i>-wheel-F?-steer` for the choreography bake."""
    livery = dict(LIVERIES[livery_key])
    livery["name"] = f"{livery_key}"
    holder = bpy.data.objects.new(f"car-{index}", None)
    bpy.context.scene.collection.objects.link(holder)

    _fuselage(livery, holder)
    _sidepods(livery, holder)
    _front_wing(livery, holder)
    _rear_wing(livery, holder)
    _floor(holder)
    _halo(holder)
    _fin_and_airbox(livery, holder)
    _cockpit(livery, holder)
    _suspension(holder)

    w = WHEEL
    for x, tag, width, steer in (
        (w["front_x"], "FL", w["width_front"], True),
        (w["front_x"], "FR", w["width_front"], True),
        (w["rear_x"], "RL", w["width_rear"], False),
        (w["rear_x"], "RR", w["width_rear"], False),
    ):
        side = 1 if tag.endswith("L") else -1
        _wheel(f"f1-{index}-wheel-{tag}", x, side * w["track"], w["radius"], width, holder, steer)

    # rain light — the slim vertical LED on the rear crash structure
    rain = _mat("f1-rain-light", "#ff2222", rough=0.3)
    rain.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1, 0.08, 0.08, 1)
    rain.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 40
    _box("rain-light", (0.05, 0.09, 0.16), (-2.28, 0, 0.30), rain, holder)

    return holder
