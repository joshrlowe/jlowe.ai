"use client";

import { useEffect, useState } from "react";

import { inputStore, type InputState } from "../state/input-store";

/** Debug-only readout proving keyboard/gamepad/touch all drive one store. */
export function InputReadout() {
  const [state, setState] = useState<InputState>(() => inputStore.getState());

  useEffect(() => {
    const id = setInterval(() => setState(inputStore.getState()), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/80 px-3 py-2 font-mono text-xs text-muted-foreground backdrop-blur">
      <div>
        thr <span className="text-starlight">{state.throttle.toFixed(2)}</span>{" "}
        · brk {state.brake.toFixed(2)}
      </div>
      <div>
        steer {state.steer.toFixed(2)} {state.handbrake ? "· ⊘hb" : ""}
      </div>
      <div>
        src [{state.source}]{state.recover ? " · ⤓recover" : ""}
      </div>
    </div>
  );
}
