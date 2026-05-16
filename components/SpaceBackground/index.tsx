import { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import CosmicStarfield from "./CosmicStarfield";
import CameraController from "./CameraController";
import SupernovaFlash from "./SupernovaFlash";
import ReducedMotionFallback from "./ReducedMotionFallback";
import { STAR_COUNT, CAMERA_POSITION_Z, CAMERA_FOV } from "./constants";

interface SpaceSceneProps {
  triggerExplosion: boolean;
  skipAnimation: boolean;
}

function SpaceScene({ triggerExplosion, skipAnimation }: SpaceSceneProps) {
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
    // SSR-safe hydration: set client-only state on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const hasPlayed = sessionStorage.getItem("introAnimationPlayed") === "true";
    if (hasPlayed) {
      setSkipAnimation(true);
      setAnimationComplete(true);
      setTriggerExplosion(true);
      window.dispatchEvent(new CustomEvent("introAnimationComplete"));
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setAnimationComplete(true);
      setTriggerExplosion(true);
    }

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 z-0 bg-black" />;
  }

  if (reducedMotion) {
    return <ReducedMotionFallback />;
  }

  return (
    <>
      {!animationComplete && (
        <SupernovaFlash onFlash={handleFlash} onComplete={handleAnimationComplete} />
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
          <SpaceScene triggerExplosion={triggerExplosion} skipAnimation={skipAnimation} />
        </Canvas>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>
    </>
  );
}
