"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";

import { writeInput } from "./state/input-store";
import {
  installKeyboard,
  readGamepad,
  readKeyboard,
  readTouch,
} from "./state/input-sources";
import { reduceInputs } from "./state/reduce-inputs";

/**
 * Polls all input sources once per frame (inside the Canvas) and writes the
 * combined state to the vanilla input store. Lives in the render loop so the
 * vehicle can read `inputStore.getState()` with zero React churn.
 */
export function InputBridge() {
  useEffect(() => installKeyboard(), []);

  useFrame(() => {
    writeInput(reduceInputs(readKeyboard(), readGamepad(), readTouch()));
  });

  return null;
}
