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

interface StarGeometry {
  geometry: THREE.BufferGeometry;
  finalPositions: Float32Array;
}

function createStarGeometry(count: number): StarGeometry {
  const positions = new Float32Array(count * 3);
  const finalPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius =
      STAR_MIN_RADIUS + Math.pow(Math.random(), 0.4) * STAR_MAX_RADIUS_FACTOR;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const fx = radius * Math.sin(phi) * Math.cos(theta);
    const fy = radius * Math.sin(phi) * Math.sin(theta);
    const fz = radius * Math.cos(phi);

    finalPositions[i * 3] = fx;
    finalPositions[i * 3 + 1] = fy;
    finalPositions[i * 3 + 2] = fz;

    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    const color = getWeightedStarColor();
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    const sizeRoll = Math.random();
    if (sizeRoll > STAR_SIZE_THRESHOLDS.LARGE) {
      sizes[i] =
        STAR_SIZE_RANGES.LARGE.min +
        Math.random() * STAR_SIZE_RANGES.LARGE.variance;
    } else if (sizeRoll > STAR_SIZE_THRESHOLDS.MEDIUM) {
      sizes[i] =
        STAR_SIZE_RANGES.MEDIUM.min +
        Math.random() * STAR_SIZE_RANGES.MEDIUM.variance;
    } else if (sizeRoll > STAR_SIZE_THRESHOLDS.SMALL) {
      sizes[i] =
        STAR_SIZE_RANGES.SMALL.min +
        Math.random() * STAR_SIZE_RANGES.SMALL.variance;
    } else {
      sizes[i] =
        STAR_SIZE_RANGES.TINY.min +
        Math.random() * STAR_SIZE_RANGES.TINY.variance;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  return { geometry, finalPositions };
}

interface CosmicStarfieldProps {
  count?: number;
  explode?: boolean;
  skipAnimation?: boolean;
}

export default function CosmicStarfield({
  count = STAR_COUNT,
  explode = false,
  skipAnimation = false,
}: CosmicStarfieldProps) {
  const points = useRef<THREE.Points | null>(null);
  const animationProgress = useRef(skipAnimation ? 1 : 0);
  const isAnimating = useRef(false);

  const { geometry, finalPositions } = useMemo(
    () => createStarGeometry(count),
    [count],
  );

  useEffect(() => {
    if (skipAnimation) {
      animationProgress.current = 1;
      const positionsAttr = geometry.attributes.position as THREE.BufferAttribute;
      const positions = positionsAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line react-hooks/immutability
        positions[i * 3] = finalPositions[i * 3];
        // eslint-disable-next-line react-hooks/immutability
        positions[i * 3 + 1] = finalPositions[i * 3 + 1];
        // eslint-disable-next-line react-hooks/immutability
        positions[i * 3 + 2] = finalPositions[i * 3 + 2];
      }
      // eslint-disable-next-line react-hooks/immutability
      positionsAttr.needsUpdate = true;
    } else if (explode && !isAnimating.current) {
      isAnimating.current = true;
      animationProgress.current = 0;
    }
  }, [explode, skipAnimation, geometry, finalPositions, count]);

  useFrame((state, delta) => {
    if (!points.current) return;

    if (isAnimating.current && animationProgress.current < 1) {
      animationProgress.current += delta * EXPLOSION_SPEED_FACTOR;
      animationProgress.current = Math.min(animationProgress.current, 1);

      const eased = 1 - Math.pow(1 - animationProgress.current, 3);

      const positionsAttr = geometry.attributes.position as THREE.BufferAttribute;
      const positions = positionsAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line react-hooks/immutability
        positions[i * 3] = finalPositions[i * 3] * eased;
        // eslint-disable-next-line react-hooks/immutability
        positions[i * 3 + 1] = finalPositions[i * 3 + 1] * eased;
        // eslint-disable-next-line react-hooks/immutability
        positions[i * 3 + 2] = finalPositions[i * 3 + 2] * eased;
      }

      // eslint-disable-next-line react-hooks/immutability
      positionsAttr.needsUpdate = true;
    }

    // eslint-disable-next-line react-hooks/immutability
    points.current.rotation.y =
      state.clock.elapsedTime * AMBIENT_ROTATION_SPEED;
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
