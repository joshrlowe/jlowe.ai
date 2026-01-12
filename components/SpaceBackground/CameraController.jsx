/**
 * CameraController - Mouse-reactive camera movement
 *
 * Provides smooth parallax effect based on mouse position.
 */
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  MOUSE_ROTATION_FACTOR_X,
  MOUSE_ROTATION_FACTOR_Y,
  CAMERA_FOLLOW_SPEED,
  ROTATION_LERP_SPEED,
  MOUSE_POSITION_SCALE_X,
  MOUSE_POSITION_SCALE_Y,
} from "./constants";

export default function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    // Calculate target rotation from mouse position
    targetRotation.current.x = mouse.current.y * MOUSE_ROTATION_FACTOR_X;
    targetRotation.current.y = mouse.current.x * MOUSE_ROTATION_FACTOR_Y;

    // Smoothly interpolate camera position
    camera.position.x +=
      (mouse.current.x * MOUSE_POSITION_SCALE_X - camera.position.x) *
      CAMERA_FOLLOW_SPEED;
    camera.position.y +=
      (mouse.current.y * MOUSE_POSITION_SCALE_Y - camera.position.y) *
      CAMERA_FOLLOW_SPEED;

    // Smoothly interpolate rotation
    camera.rotation.x +=
      (targetRotation.current.x - camera.rotation.x) * ROTATION_LERP_SPEED;
    camera.rotation.y +=
      (targetRotation.current.y - camera.rotation.y) * ROTATION_LERP_SPEED;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

