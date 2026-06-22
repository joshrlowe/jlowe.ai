"use client";

import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
  useAfterPhysicsStep,
  useRapier,
} from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import * as THREE from "three/webgpu";

import { inputStore } from "../state/input-store";
import { CarBody } from "./car";
import {
  CHASSIS_HALF,
  SUSPENSION_DOWN,
  WHEEL_AXLE,
  WHEEL_CONNECTIONS,
} from "./tuning";
import { useVehicleTuning } from "./use-vehicle-tuning";
import { DetailedWheel } from "./wheel";

type VehicleController = ReturnType<
  ReturnType<typeof useRapier>["world"]["createVehicleController"]
>;

export interface SpawnPose {
  position: [number, number, number];
  heading?: number; // y-rotation aligning car-forward (+z) with the track
}

const DEFAULT_SPAWN: SpawnPose = { position: [0, 1.2, 0], heading: 0 };

interface VehicleProps {
  chassisRef: RefObject<RapierRigidBody | null>;
  /** An Object3D inside the chassis the chase camera follows (world-space). */
  cameraTargetRef: RefObject<THREE.Object3D | null>;
  /** Inputs are applied only when true (the FSM gates this in driving). */
  controllable?: boolean;
  /** Spawn + recover pose (defaults to the origin facing +z). */
  spawn?: SpawnPose;
  /** Per-step telemetry sink (speed km/h, normalized rpm 0..1). */
  onTelemetry?: (t: { speedKmh: number; rpm: number }) => void;
}

/**
 * Rapier raycast vehicle (DynamicRayCastVehicleController): 4 ray wheels +
 * suspension + friction-slip grip + speed² downforce. Inputs come from the
 * input store each physics step; visual wheels are synced from the controller's
 * readbacks. "recover" respawns the chassis. All feel constants are live-tunable.
 */
export function Vehicle({
  chassisRef,
  cameraTargetRef,
  controllable = true,
  spawn = DEFAULT_SPAWN,
  onTelemetry,
}: VehicleProps) {
  const { world } = useRapier();
  const tuning = useVehicleTuning();
  const controller = useRef<VehicleController | null>(null);
  const wheels = useRef<(THREE.Object3D | null)[]>([null, null, null, null]);
  const recoverPrev = useRef(false);

  useAfterPhysicsStep(() => {
    const chassis = chassisRef.current;
    if (!chassis) return;

    if (controller.current === null) {
      const c = world.createVehicleController(chassis);
      for (const conn of WHEEL_CONNECTIONS) {
        c.addWheel(
          conn,
          SUSPENSION_DOWN,
          WHEEL_AXLE,
          tuning.suspensionRestLength,
          tuning.wheelRadius,
        );
      }
      controller.current = c;
    }
    const c = controller.current;
    const input = inputStore.getState();

    // recover — edge-triggered
    if (input.recover && !recoverPrev.current) {
      const h = (spawn.heading ?? 0) / 2;
      chassis.setTranslation(
        { x: spawn.position[0], y: spawn.position[1], z: spawn.position[2] },
        true,
      );
      chassis.setRotation({ x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) }, true);
      chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
      chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    recoverPrev.current = input.recover;

    const speed = c.currentVehicleSpeed();
    const throttle = controllable ? input.throttle : 0;
    const brakeInput = controllable ? input.brake : 0;
    const steerInput = controllable ? input.steer : 0;

    // brake → reverse when nearly stopped, else braking force.
    const engine =
      throttle * tuning.engineForce -
      (speed < 1 ? brakeInput * tuning.reverseForce : 0);
    const brake = speed >= 1 ? brakeInput * tuning.brakeForce : 0;
    const steer = steerInput * tuning.maxSteer;

    for (let i = 0; i < c.numWheels(); i++) {
      const front = i < 2;
      c.setWheelSteering(i, front ? steer : 0);
      c.setWheelEngineForce(i, front ? 0 : engine); // RWD
      c.setWheelBrake(
        i,
        input.handbrake && !front ? tuning.brakeForce * 2 : brake,
      );
      // live tuning re-applied each step
      c.setWheelSuspensionStiffness(i, tuning.suspensionStiffness);
      c.setWheelSuspensionCompression(i, tuning.suspensionCompression);
      c.setWheelSuspensionRelaxation(i, tuning.suspensionRelaxation);
      c.setWheelMaxSuspensionTravel(i, tuning.maxSuspensionTravel);
      c.setWheelMaxSuspensionForce(i, tuning.maxSuspensionForce);
      c.setWheelFrictionSlip(i, tuning.frictionSlip);
      c.setWheelSideFrictionStiffness(i, tuning.sideFrictionStiffness);
      c.setWheelRadius(i, tuning.wheelRadius);
    }

    // downforce ∝ speed²
    const df = tuning.downforce * speed * speed;
    chassis.addForce({ x: 0, y: -df, z: 0 }, true);

    c.updateVehicle(world.timestep);

    if (onTelemetry) {
      const absSpeed = Math.abs(speed);
      const rpm = Math.min(
        0.12 + Math.abs(throttle) * 0.45 + Math.min(absSpeed / 30, 1) * 0.43,
        1,
      );
      onTelemetry({ speedKmh: absSpeed * 3.6, rpm });
    }
  });

  // Sync visual wheels from controller readbacks (chassis-local).
  useFrame(() => {
    const c = controller.current;
    if (c === null) return;
    for (let i = 0; i < c.numWheels(); i++) {
      const obj = wheels.current[i];
      if (!obj) continue;
      const conn = c.wheelChassisConnectionPointCs(i);
      const dir = c.wheelDirectionCs(i);
      const len = c.wheelSuspensionLength(i) ?? tuning.suspensionRestLength;
      if (conn && dir) {
        obj.position.set(
          conn.x + dir.x * len,
          conn.y + dir.y * len,
          conn.z + dir.z * len,
        );
      }
      obj.rotation.order = "YXZ";
      obj.rotation.set(c.wheelRotation(i) ?? 0, c.wheelSteering(i) ?? 0, 0);
    }
  });

  return (
    <RigidBody
      ref={chassisRef}
      colliders={false}
      canSleep={false}
      position={spawn.position}
      rotation={[0, spawn.heading ?? 0, 0]}
    >
      <CuboidCollider
        args={[CHASSIS_HALF.x, CHASSIS_HALF.y, CHASSIS_HALF.z]}
        mass={tuning.chassisMass}
      />
      <CarBody />
      <object3D ref={cameraTargetRef} position={[0, 1, -0.5]} />
      {WHEEL_CONNECTIONS.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            wheels.current[i] = el;
          }}
        >
          <DetailedWheel radius={tuning.wheelRadius} />
        </group>
      ))}
    </RigidBody>
  );
}
