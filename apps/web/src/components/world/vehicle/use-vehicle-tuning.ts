"use client";

import { useControls } from "leva";

import { VEHICLE_TUNING, type VehicleTuning } from "./tuning";

/**
 * The live vehicle tuning: base constants overridden by a leva panel (visible
 * only under ?debug=1, since <Leva> mounts only then). The vehicle re-applies
 * these every physics step, so dragging a slider re-tunes the car live.
 */
export function useVehicleTuning(): VehicleTuning {
  const o = useControls("vehicle", {
    engineForce: {
      value: VEHICLE_TUNING.engineForce,
      min: 200,
      max: 5000,
      step: 50,
    },
    reverseForce: {
      value: VEHICLE_TUNING.reverseForce,
      min: 100,
      max: 2000,
      step: 50,
    },
    brakeForce: {
      value: VEHICLE_TUNING.brakeForce,
      min: 10,
      max: 500,
      step: 5,
    },
    maxSteer: {
      value: VEHICLE_TUNING.maxSteer,
      min: 0.2,
      max: 0.9,
      step: 0.01,
    },
    suspensionStiffness: {
      value: VEHICLE_TUNING.suspensionStiffness,
      min: 5,
      max: 60,
      step: 1,
    },
    frictionSlip: {
      value: VEHICLE_TUNING.frictionSlip,
      min: 0.5,
      max: 5,
      step: 0.1,
    },
    downforce: { value: VEHICLE_TUNING.downforce, min: 0, max: 60, step: 1 },
  });
  return { ...VEHICLE_TUNING, ...o };
}
