"use client";

import { useRef } from "react";

import { useCoarsePointer } from "@/lib/use-coarse-pointer";

import { setTouch } from "../state/input-sources";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Mobile driving controls: left half = steer pad (horizontal drag), right half
 * = throttle (drag up). DOM overlay; writes the touch input singleton that the
 * in-canvas InputBridge reads. Only renders on touch-primary devices.
 */
export function TouchControls() {
  const coarse = useCoarsePointer();
  const steerOrigin = useRef<number | null>(null);
  const throttleOrigin = useRef<number | null>(null);

  if (!coarse) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-1/2 w-1/2 touch-none"
        onPointerDown={(e) => {
          steerOrigin.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
          setTouch({ active: true });
        }}
        onPointerMove={(e) => {
          if (steerOrigin.current !== null)
            setTouch({
              steer: clamp((e.clientX - steerOrigin.current) / 90, -1, 1),
            });
        }}
        onPointerUp={() => {
          steerOrigin.current = null;
          setTouch({ steer: 0 });
        }}
        onPointerCancel={() => {
          steerOrigin.current = null;
          setTouch({ steer: 0 });
        }}
      >
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground/60">
          ◀ steer ▶
        </span>
      </div>

      <div
        className="pointer-events-auto absolute bottom-0 right-0 h-1/2 w-1/2 touch-none"
        onPointerDown={(e) => {
          throttleOrigin.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
          setTouch({ throttle: 0.4, active: true });
        }}
        onPointerMove={(e) => {
          if (throttleOrigin.current !== null)
            setTouch({
              throttle: clamp((throttleOrigin.current - e.clientY) / 120, 0, 1),
            });
        }}
        onPointerUp={() => {
          throttleOrigin.current = null;
          setTouch({ throttle: 0 });
        }}
        onPointerCancel={() => {
          throttleOrigin.current = null;
          setTouch({ throttle: 0 });
        }}
      >
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground/60">
          ▲ throttle
        </span>
      </div>
    </div>
  );
}
