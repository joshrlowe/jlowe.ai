/**
 * SpaceBackground - Main entry point
 *
 * SUPERNOVA v2.3 - Stars explode from center
 * - White 3D ring collapsing on fuchsia star
 * - Stars burst outward from explosion center
 * - Realistic night sky colors
 * - Highly reactive to mouse movement
 */
import { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import CosmicStarfield from "./CosmicStarfield";
import CameraController from "./CameraController";
import SupernovaFlash from "./SupernovaFlash";
import ReducedMotionFallback from "./ReducedMotionFallback";
import { STAR_COUNT, CAMERA_POSITION_Z, CAMERA_FOV } from "./constants";

function SpaceScene({ triggerExplosion, skipAnimation }) {
  return (
    <>
      <CosmicStarfield
        count={STAR_COUNT}
        explode={triggerExplosion}
        skipAnimation={skipAnimation}
      />
      <CameraController />
    </>
  );
}

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
      window.dispatchEvent(new CustomEvent("introAnimationComplete"));
    }

    // Check for reduced motion preference
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

  // Loading placeholder
  if (!mounted) {
    return <div className="fixed inset-0 z-0 bg-black" />;
  }

  // Accessibility: static fallback for reduced motion
  if (reducedMotion) {
    return <ReducedMotionFallback />;
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
          camera={{ position: [0, 0, CAMERA_POSITION_Z], fov: CAMERA_FOV }}
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

