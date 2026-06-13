// All vehicle feel constants live here (leva-tunable via use-vehicle-tuning).
// Forces in rapier units; steering in radians. RWD, front-steer.

export interface VehicleTuning {
  engineForce: number;
  reverseForce: number;
  brakeForce: number;
  maxSteer: number;
  suspensionStiffness: number;
  suspensionCompression: number;
  suspensionRelaxation: number;
  maxSuspensionTravel: number;
  maxSuspensionForce: number;
  suspensionRestLength: number;
  wheelRadius: number;
  frictionSlip: number;
  sideFrictionStiffness: number;
  downforce: number; // chassis-down force ∝ speed²
  chassisMass: number;
}

export const VEHICLE_TUNING: VehicleTuning = {
  engineForce: 1800,
  reverseForce: 800,
  brakeForce: 130,
  maxSteer: 0.55,
  suspensionStiffness: 24,
  suspensionCompression: 0.82,
  suspensionRelaxation: 0.88,
  maxSuspensionTravel: 0.3,
  maxSuspensionForce: 30000,
  suspensionRestLength: 0.32,
  wheelRadius: 0.35,
  frictionSlip: 2.2,
  sideFrictionStiffness: 0.6,
  downforce: 12,
  chassisMass: 160,
};

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const CHASSIS_HALF: Vec3 = { x: 0.9, y: 0.28, z: 1.9 };

// Suspension connection points (chassis-local): FL, FR, RL, RR.
export const WHEEL_CONNECTIONS: readonly Vec3[] = [
  { x: -0.95, y: 0, z: 1.45 },
  { x: 0.95, y: 0, z: 1.45 },
  { x: -0.95, y: 0, z: -1.45 },
  { x: 0.95, y: 0, z: -1.45 },
];

export const SUSPENSION_DOWN: Vec3 = { x: 0, y: -1, z: 0 };
export const WHEEL_AXLE: Vec3 = { x: -1, y: 0, z: 0 };
