"""Bit-exact port of apps/web/src/components/world/scenes/circuit/scatter.ts.

The web scene scatters its buildings/yachts with mulberry32; using the SAME
PRNG and call order here means the Blender set and the three.js set are the
same city, building for building. All 32-bit ops are done in uint32 space —
JS's int32 coercions (|0, ^) and uint32 shift (>>>) are bit-identical there.
"""

from __future__ import annotations

from typing import Callable

_MASK = 0xFFFFFFFF


def mulberry32(seed: int) -> Callable[[], float]:
    a = seed & _MASK

    def rnd() -> float:
        nonlocal a
        a = (a + 0x6D2B79F5) & _MASK
        t = ((a ^ (a >> 15)) * (1 | a)) & _MASK
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & _MASK)) ^ t) & _MASK
        return ((t ^ (t >> 14)) & _MASK) / 4294967296

    return rnd


class Rng:
    """Mirrors the TS `Rng` shape: next() and range(lo, hi)."""

    def __init__(self, seed: int) -> None:
        self._next = mulberry32(seed)

    def next(self) -> float:
        return self._next()

    def range(self, lo: float, hi: float) -> float:
        return lo + self._next() * (hi - lo)


def scatter(count: int, seed: int, make):
    """`make(rng, index)` is called `count` times with ONE shared rng — the
    exact call pattern of the TS scatter(), so streams line up."""
    rng = Rng(seed)
    return [make(rng, i) for i in range(count)]
