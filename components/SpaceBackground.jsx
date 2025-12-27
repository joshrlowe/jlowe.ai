/**
 * SpaceBackground.jsx
 *
 * SUPERNOVA v2.3 - Stars explode from center
 * - White 3D ring collapsing on fuchsia star
 * - Stars burst outward from explosion center
 * - Realistic night sky colors (no twinkle)
 * - Pitch black sky
 * - Highly reactive to mouse movement
 */

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================
// STATIC STAR SHADER - No twinkle, varied sizes
// ============================================
const starVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Soft circular star shape
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    float glow = exp(-dist * 4.0);
    
    gl_FragColor = vec4(vColor, alpha * glow);
  }
`;

// ============================================
// COSMIC STARFIELD - Stars explode from center
// ============================================
const CosmicStarfield = ({
  count = 3500,
  explode = false,
  skipAnimation = false,
}) => {
  const points = useRef();
  const animationProgress = useRef(skipAnimation ? 1 : 0);
  const isAnimating = useRef(false);

  const [geometry, finalPositions] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const finals = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Realistic night sky star colors
    const starColors = [
      new THREE.Color("#CAE8FF"),
      new THREE.Color("#B8D4F1"),
      new THREE.Color("#A8C8E8"),
      new THREE.Color("#FFFFFF"),
      new THREE.Color("#FFF8F0"),
      new THREE.Color("#FFFDF8"),
      new THREE.Color("#FFF4E8"),
      new THREE.Color("#FFEFD5"),
      new THREE.Color("#FFE4B5"),
      new THREE.Color("#FFD89B"),
      new THREE.Color("#FFD2A1"),
      new THREE.Color("#FFBE7D"),
      new THREE.Color("#FFB07C"),
    ];

    const colorWeights = [2, 2, 3, 20, 18, 15, 12, 10, 8, 5, 3, 1, 1];
    const totalWeight = colorWeights.reduce((a, b) => a + b, 0);

    const getWeightedColor = () => {
      let random = Math.random() * totalWeight;
      for (let i = 0; i < colorWeights.length; i++) {
        random -= colorWeights[i];
        if (random <= 0) return starColors[i];
      }
      return starColors[3];
    };

    for (let i = 0; i < count; i++) {
      // Final positions - spherically distributed
      const radius = 20 + Math.pow(Math.random(), 0.4) * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const fx = radius * Math.sin(phi) * Math.cos(theta);
      const fy = radius * Math.sin(phi) * Math.sin(theta);
      const fz = radius * Math.cos(phi);

      finals[i * 3] = fx;
      finals[i * 3 + 1] = fy;
      finals[i * 3 + 2] = fz;

      // Start at center (will animate outward)
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const color = getWeightedColor();
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varied sizes
      const sizeRoll = Math.random();
      if (sizeRoll > 0.98) {
        sizes[i] = 5 + Math.random() * 4;
      } else if (sizeRoll > 0.9) {
        sizes[i] = 3 + Math.random() * 2;
      } else if (sizeRoll > 0.7) {
        sizes[i] = 1.8 + Math.random() * 1.2;
      } else {
        sizes[i] = 0.8 + Math.random() * 1;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    return [geo, finals];
  }, [count]);

  // Start animation when explode becomes true, or skip if already played
  useEffect(() => {
    if (skipAnimation) {
      // Immediately set stars to final positions
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
      // Quick explosion - complete in ~0.8 seconds
      animationProgress.current += delta * 1.25;
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
    points.current.rotation.y = state.clock.elapsedTime * 0.003;
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
};

// ============================================
// REACTIVE CAMERA CONTROLLER - More responsive
// ============================================
const CameraController = () => {
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
    // More reactive movement
    targetRotation.current.x = mouse.current.y * 0.15;
    targetRotation.current.y = mouse.current.x * 0.25;

    camera.position.x += (mouse.current.x * 8 - camera.position.x) * 0.04;
    camera.position.y += (mouse.current.y * 5 - camera.position.y) * 0.04;

    camera.rotation.x += (targetRotation.current.x - camera.rotation.x) * 0.03;
    camera.rotation.y += (targetRotation.current.y - camera.rotation.y) * 0.03;

    camera.lookAt(0, 0, 0);
  });

  return null;
};

// ============================================
// MAIN SCENE
// ============================================
const SpaceScene = ({ triggerExplosion, skipAnimation }) => {
  return (
    <>
      <CosmicStarfield
        count={3500}
        explode={triggerExplosion}
        skipAnimation={skipAnimation}
      />
      <CameraController />
    </>
  );
};

// ============================================
// SUPERNOVA - White 3D ring + Fuchsia star
// ============================================
const SupernovaFlash = ({ onFlash, onComplete }) => {
  const [phase, setPhase] = useState("rings"); // rings -> flash -> fade -> done

  useEffect(() => {
    // Timeline: rings converge (1.6s) -> flash (trigger stars) -> fade (1.5s)
    const flashTimer = setTimeout(() => {
      setPhase("flash");
      if (onFlash) onFlash(); // Trigger star explosion
    }, 1600);
    const fadeTimer = setTimeout(() => setPhase("fade"), 1800);
    const completeTimer = setTimeout(() => {
      setPhase("done");
      if (onComplete) onComplete();
    }, 3300);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onFlash, onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Container for both star and rings - same position */}
      {phase === "rings" && (
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          {/* Fuchsia star in center */}
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "50px",
              height: "50px",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, #FFFFFF 0%, #FF69B4 25%, #F72585 50%, #B5179E 75%, #7B2CBF 100%)",
              boxShadow: `
                0 0 30px 15px rgba(247, 37, 133, 0.9),
                0 0 60px 30px rgba(181, 23, 158, 0.7),
                0 0 100px 50px rgba(123, 44, 191, 0.5),
                0 0 150px 75px rgba(72, 12, 168, 0.3)
              `,
              animation: "starPulse 0.3s ease-in-out infinite alternate",
              zIndex: 10,
            }}
          />

          {/* 3D Saturn-style rings - high resolution */}
          <div
            style={{
              transform: "perspective(1000px) rotateX(72deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Multiple fine rings for smooth appearance */}
            {Array.from({ length: 12 }).map((_, i) => {
              const opacity = 0.9 - i * 0.06;
              const delay = i * 0.025;
              const duration = 1.05 + i * 0.04;
              const thickness = Math.max(1, 2 - i * 0.1);

              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: "20px",
                    height: "20px",
                    border: `${thickness}px solid rgba(255, 255, 255, ${opacity})`,
                    boxShadow: `
                      0 0 ${8 + i * 3}px rgba(255, 255, 255, ${opacity * 0.8}),
                      0 0 ${16 + i * 5}px rgba(255, 255, 255, ${opacity * 0.5}),
                      0 0 ${28 + i * 7}px rgba(255, 255, 255, ${opacity * 0.25})
                    `,
                    animation: `ringIn ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* White flash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, #FFFFFF 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.5) 60%, transparent 100%)",
          opacity: phase === "flash" ? 1 : phase === "fade" ? 0 : 0,
          transition:
            phase === "flash"
              ? "opacity 0.1s ease-out"
              : "opacity 1.5s ease-out",
        }}
      />

      <style jsx>{`
        @keyframes ringIn {
          0% {
            transform: translate(-50%, -50%) scale(50);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes starPulse {
          0% {
            filter: brightness(1);
          }
          100% {
            filter: brightness(1.3);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function SpaceBackground() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [triggerExplosion, setTriggerExplosion] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  const handleFlash = useCallback(() => {
    setTriggerExplosion(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setAnimationComplete(true);
    // Mark that animation has played this session
    if (typeof window !== "undefined") {
      sessionStorage.setItem("introAnimationPlayed", "true");
      window.dispatchEvent(new CustomEvent("introAnimationComplete"));
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Check if animation has already played this session
    const hasPlayed = sessionStorage.getItem("introAnimationPlayed") === "true";
    if (hasPlayed) {
      setSkipAnimation(true);
      setAnimationComplete(true);
      setTriggerExplosion(true);
      // Still dispatch event so header/hero know to show immediately
      window.dispatchEvent(new CustomEvent("introAnimationComplete"));
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setAnimationComplete(true);
      setTriggerExplosion(true);
    }

    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!mounted) return <div className="fixed inset-0 z-0 bg-black" />;

  // Static fallback for reduced motion
  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-0 bg-black">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
            radial-gradient(3px 3px at 20px 30px, #FFFFFF, transparent),
            radial-gradient(2px 2px at 40px 70px, #FFF8F0, transparent),
            radial-gradient(4px 4px at 90px 40px, #FFFDF8, transparent),
            radial-gradient(2px 2px at 160px 120px, #FFE4B5, transparent),
            radial-gradient(3px 3px at 200px 80px, #CAE8FF, transparent),
            radial-gradient(2px 2px at 280px 200px, #FFD89B, transparent),
            radial-gradient(5px 5px at 100px 150px, #FFFFFF, transparent)
          `,
            backgroundSize: "300px 300px",
          }}
        />
      </div>
    );
  }

  return (
    <>
      {!animationComplete && (
        <SupernovaFlash
          onFlash={handleFlash}
          onComplete={handleAnimationComplete}
        />
      )}

      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 18], fov: 60 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          style={{ background: "#000000" }}
        >
          <color attach="background" args={["#000000"]} />
          <SpaceScene
            triggerExplosion={triggerExplosion}
            skipAnimation={skipAnimation}
          />
        </Canvas>

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>
    </>
  );
}
