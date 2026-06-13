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
import { PlaceholderCarBody } from "./placeholder-car";
import {
  CHASSIS_HALF,
  SUSPENSION_DOWN,
  WHEEL_AXLE,
  WHEEL_CONNECTIONS,
} from "./tuning";
import { useVehicleTuning } from "./use-vehicle-tuning";

type VehicleController = ReturnType<
  ReturnType<typeof useRapier>["world"]["createVehicleController"]
>;

const SPAWN = { x: 0, y: 1.2, z: 0 };

function Wheel({ radius }: { radius: number }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius, radius, 0.3, 18]} />
      <meshStandardMaterial color="#0a0807" roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

interface VehicleProps {
  chassisRef: RefObject<RapierRigidBody | null>;
  /** An Object3D inside the chassis the chase camera follows (world-space). */
  cameraTargetRef: RefObject<THREE.Object3D | null>;
  /** Inputs are applied only when true (the FSM gates this in driving). */
  controllable?: boolean;
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
      chassis.setTranslation(SPAWN, true);
      chassis.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
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
      position={[SPAWN.x, SPAWN.y, SPAWN.z]}
    >
      <CuboidCollider
        args={[CHASSIS_HALF.x, CHASSIS_HALF.y, CHASSIS_HALF.z]}
        mass={tuning.chassisMass}
      />
      <PlaceholderCarBody />
      <object3D ref={cameraTargetRef} position={[0, 1, -0.5]} />
      {WHEEL_CONNECTIONS.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            wheels.current[i] = el;
          }}
        >
          <Wheel radius={tuning.wheelRadius} />
        </group>
      ))}
    </RigidBody>
  );
}
