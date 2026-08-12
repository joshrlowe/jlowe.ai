"use client";

import { useEffect, useState } from "react";

import { readPerf, type PerfSample } from "./perf-stats";

/** DOM overlay polling the perf store at 4Hz (gated behind ?debug=1). */
export function PerfOverlay() {
  const [stats, setStats] = useState<PerfSample>({
    fps: 0,
    calls: 0,
    triangles: 0,
  });

  useEffect(() => {
    const id = setInterval(() => setStats(readPerf()), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/80 px-3 py-2 font-mono text-xs text-muted-foreground backdrop-blur">
      <div>
        fps <span className="text-starlight">{stats.fps || "—"}</span>
      </div>
      <div>
        draws <span className="text-foreground">{stats.calls || "—"}</span>
      </div>
      <div>
        tris{" "}
        <span className="text-foreground">
          {stats.triangles ? stats.triangles.toLocaleString() : "—"}
        </span>
      </div>
    </div>
  );
}
