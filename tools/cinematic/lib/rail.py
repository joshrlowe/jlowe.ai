"""Port of the hero drive rail (apps/web/.../hero/car-rail.ts) plus the
cinematic's 2-lap duel choreography.

The curve math mirrors three.js `CatmullRomCurve3(points, closed=True,
"centripetal")` (Barry–Goldman nonuniform CR via cubic Hermite) with the same
arc-length reparameterisation idea (`getPointAt`), so cars hold constant speed
along the loop and land where the web scene puts them. Pure Python — no bpy —
so it runs under plain python3 for tests.
"""

from __future__ import annotations

import math
from bisect import bisect_right
from typing import Sequence

Vec3 = tuple[float, float, float]


def _sub(a: Vec3, b: Vec3) -> Vec3:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _dist_sq(a: Vec3, b: Vec3) -> float:
    d = _sub(a, b)
    return d[0] * d[0] + d[1] * d[1] + d[2] * d[2]


class CentripetalCatmullRom:
    """Closed centripetal Catmull-Rom over 3D control points, arc-length
    parameterised: `point_at(u)` / `tangent_at(u)` with u in [0,1)."""

    def __init__(self, points: Sequence[Vec3], samples: int = 1600) -> None:
        self.points = [tuple(p) for p in points]
        self._n = len(self.points)
        # Arc-length table over uniform curve-parameter t.
        self._ts = [i / samples for i in range(samples + 1)]
        pts = [self._point_t(t) for t in self._ts]
        lengths = [0.0]
        for i in range(1, len(pts)):
            lengths.append(lengths[-1] + math.dist(pts[i - 1], pts[i]))
        self.length = lengths[-1]
        self._lengths = lengths

    # -- three.js CatmullRomCurve3.getPoint (closed, centripetal) -------------
    def _point_t(self, t: float) -> Vec3:
        n = self._n
        p = t * n  # closed: t in [0,1) spans n segments
        i = int(math.floor(p))
        w = p - i
        p0 = self.points[(i - 1) % n]
        p1 = self.points[i % n]
        p2 = self.points[(i + 1) % n]
        p3 = self.points[(i + 2) % n]

        # centripetal: dt = distance^(2*0.25)
        pow_ = 0.25
        dt0 = math.pow(_dist_sq(p0, p1), pow_)
        dt1 = math.pow(_dist_sq(p1, p2), pow_)
        dt2 = math.pow(_dist_sq(p2, p3), pow_)
        # safety (three.js does the same guards)
        if dt1 < 1e-4:
            dt1 = 1.0
        if dt0 < 1e-4:
            dt0 = dt1
        if dt2 < 1e-4:
            dt2 = dt1

        out = []
        for axis in range(3):
            x0, x1, x2, x3 = p0[axis], p1[axis], p2[axis], p3[axis]
            t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1
            t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2
            t1 *= dt1
            t2 *= dt1
            # cubic Hermite
            c0 = x1
            c1 = t1
            c2 = -3 * x1 + 3 * x2 - 2 * t1 - t2
            c3 = 2 * x1 - 2 * x2 + t1 + t2
            out.append(((c3 * w + c2) * w + c1) * w + c0)
        return (out[0], out[1], out[2])

    # -- arc-length mapping ----------------------------------------------------
    def _u_to_t(self, u: float) -> float:
        u = u % 1.0
        target = u * self.length
        i = bisect_right(self._lengths, target) - 1
        i = max(0, min(i, len(self._lengths) - 2))
        seg = self._lengths[i + 1] - self._lengths[i]
        frac = 0.0 if seg == 0 else (target - self._lengths[i]) / seg
        return self._ts[i] + frac * (self._ts[i + 1] - self._ts[i])

    def point_at(self, u: float) -> Vec3:
        return self._point_t(self._u_to_t(u))

    def tangent_at(self, u: float) -> Vec3:
        d = 1e-4
        a = self.point_at(u - d)
        b = self.point_at(u + d)
        v = _sub(b, a)
        n = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) or 1.0
        return (v[0] / n, v[1] / n, v[2] / n)


def heading_from_tangent(tx: float, tz: float) -> float:
    """Yaw aiming a +z-nosed model along the xz tangent — mirrors car-rail.ts."""
    return math.atan2(tx, tz)


def pose_along_curve(curve: CentripetalCatmullRom, t: float, lateral: float):
    """(position, yaw) with a signed lateral offset — mirrors
    carPoseAlongCurveOffset (three-space coordinates)."""
    u = t % 1.0
    px, py, pz = curve.point_at(u)
    tx, _, tz = curve.tangent_at(u)
    sx, sz = tz, -tx
    ln = math.hypot(sx, sz) or 1.0
    return (
        (px + lateral * sx / ln, py, pz + lateral * sz / ln),
        heading_from_tangent(tx, tz),
    )


# -- The 2-lap duel ------------------------------------------------------------


def cyclic_catmull_1d(keys: Sequence[Sequence[float]], x: float) -> float:
    """Periodic (period 1) 1-D Catmull-Rom through (x_i, v_i) keys, finite-
    difference tangents with wrap-aware x distances. Drives the challenger's
    longitudinal offset so the two-lap story is smooth AND loops perfectly."""
    ks = sorted((k[0] % 1.0, k[1]) for k in keys)
    n = len(ks)
    x = x % 1.0

    def key(i: int) -> tuple[float, float]:
        # unwrap x so neighbours are monotonically increasing around the loop
        base, (kx, kv) = divmod(i, n)[0], ks[i % n]
        return (kx + base, kv)

    # find segment j such that ks[j].x <= x < ks[j+1].x (with wrap)
    j = n - 1
    for idx in range(n):
        if ks[idx][0] <= x:
            j = idx
    x0, v0 = key(j - 1)
    x1, v1 = key(j)
    x2, v2 = key(j + 1)
    x3, v3 = key(j + 2)
    if x < x1:  # x sits before the found key only when wrapped below the first
        x0, v0 = x0 - 1, v0
        x1, v1 = x1 - 1, v1
        x2, v2 = x2 - 1, v2
        x3, v3 = x3 - 1, v3

    h = (x2 - x1) or 1e-9
    s = (x - x1) / h
    m1 = (v2 - v0) / ((x2 - x0) or 1e-9) * h
    m2 = (v3 - v1) / ((x3 - x1) or 1e-9) * h
    s2, s3 = s * s, s * s * s
    return (
        (2 * s3 - 3 * s2 + 1) * v1
        + (s3 - 2 * s2 + s) * m1
        + (-2 * s3 + 3 * s2) * v2
        + (s3 - s2) * m2
    )


def duel_offset(u2: float, keys, pass_amp: float) -> float:
    """Challenger's longitudinal curve-param offset at 2-lap phase u2."""
    return pass_amp * cyclic_catmull_1d(keys, u2)


def car_param(u2: float, laps: int, t_offset: float, role: str, keys, pass_amp: float) -> float:
    """Curve param for a car at 2-lap video phase u2 (mirrors the hero.tsx
    frame loop, with the sine swap replaced by the 2-lap duel curve)."""
    base_t = u2 * laps
    if role == "challenger":
        return base_t + t_offset + duel_offset(u2, keys, pass_amp)
    return base_t + t_offset
