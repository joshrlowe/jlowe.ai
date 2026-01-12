/**
 * CosmicStarfield - WebGL star field with explosion animation
 *
 * Stars explode outward from center point with realistic colors and sizes.
 */
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { starVertexShader, starFragmentShader } from "./shaders";
import { getWeightedStarColor } from "./starColors";
import {
  STAR_COUNT,
  STAR_MIN_RADIUS,
  STAR_MAX_RADIUS_FACTOR,
  EXPLOSION_SPEED_FACTOR,
  AMBIENT_ROTATION_SPEED,
  STAR_SIZE_THRESHOLDS,
  STAR_SIZE_RANGES,
} from "./constants";

/**
 * Generates star geometry with positions, colors, and sizes
 */
function createStarGeometry(count) {
  const positions = new Float32Array(count * 3);
  const finalPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Final positions - spherically distributed
    const radius = STAR_MIN_RADIUS + Math.pow(Math.random(), 0.4) * STAR_MAX_RADIUS_FACTOR;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const fx = radius * Math.sin(phi) * Math.cos(theta);
    const fy = radius * Math.sin(phi) * Math.sin(theta);
    const fz = radius * Math.cos(phi);

    finalPositions[i * 3] = fx;
    finalPositions[i * 3 + 1] = fy;
    finalPositions[i * 3 + 2] = fz;

    // Start at center (will animate outward)
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    // Color
    const color = getWeightedStarColor();
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    // Size distribution
    const sizeRoll = Math.random();
    if (sizeRoll > STAR_SIZE_THRESHOLDS.LARGE) {
      sizes[i] = STAR_SIZE_RANGES.LARGE.min + Math.random() * STAR_SIZE_RANGES.LARGE.variance;
    } else if (sizeRoll > STAR_SIZE_THRESHOLDS.MEDIUM) {
      sizes[i] = STAR_SIZE_RANGES.MEDIUM.min + Math.random() * STAR_SIZE_RANGES.MEDIUM.variance;
    } else if (sizeRoll > STAR_SIZE_THRESHOLDS.SMALL) {
      sizes[i] = STAR_SIZE_RANGES.SMALL.min + Math.random() * STAR_SIZE_RANGES.SMALL.variance;
    } else {
      sizes[i] = STAR_SIZE_RANGES.TINY.min + Math.random() * STAR_SIZE_RANGES.TINY.variance;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  return { geometry, finalPositions };
}

export default function CosmicStarfield({
  count = STAR_COUNT,
  explode = false,
  skipAnimation = false,
}) {
  const points = useRef();
  const animationProgress = useRef(skipAnimation ? 1 : 0);
  const isAnimating = useRef(false);

  const { geometry, finalPositions } = useMemo(
    () => createStarGeometry(count),
    [count]
  );

  // Handle animation start or skip
  useEffect(() => {
    if (skipAnimation) {
      animationProgress.current = 1;
      const positions = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3] = finalPositions[i * 3];
        positions[i * 3 + 1] = finalPositions[i * 3 + 1];
        positions[i * 3 + 2] = finalPositions[i * 3 + 2];
      }
      geometry.attributes.position.needsUpdate = true;
    } else if (explode && !isAnimating.current) {
      isAnimating.current = true;
      animationProgress.current = 0;
    }
  }, [explode, skipAnimation, geometry, finalPositions, count]);

  useFrame((state, delta) => {
    if (!points.current) return;

    // Animate stars exploding outward
    if (isAnimating.current && animationProgress.current < 1) {
      animationProgress.current += delta * EXPLOSION_SPEED_FACTOR;
      animationProgress.current = Math.min(animationProgress.current, 1);

      // Ease out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - animationProgress.current, 3);

      const positions = geometry.attributes.position.array;

      for (let i = 0; i < count; i++) {
        positions[i * 3] = finalPositions[i * 3] * eased;
        positions[i * 3 + 1] = finalPositions[i * 3 + 1] * eased;
        positions[i * 3 + 2] = finalPositions[i * 3 + 2] * eased;
      }

      geometry.attributes.position.needsUpdate = true;
    }

    // Slow ambient rotation
    points.current.rotation.y = state.clock.elapsedTime * AMBIENT_ROTATION_SPEED;
  });

  return (
    <points ref={points} geometry={geometry}>
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

