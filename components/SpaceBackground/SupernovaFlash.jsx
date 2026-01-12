/**
 * SupernovaFlash - Intro animation with 3D ring converging on star
 *
 * Animation sequence:
 * 1. White 3D rings converge toward center (1.6s)
 * 2. Flash triggers star explosion
 * 3. Flash fades out (1.5s)
 */
import { useState, useEffect } from "react";
import {
  RING_CONVERGE_DURATION,
  FLASH_TRIGGER_DELAY,
  ANIMATION_COMPLETE_DELAY,
} from "./constants";

const RING_COUNT = 12;

export default function SupernovaFlash({ onFlash, onComplete }) {
  const [phase, setPhase] = useState("rings"); // rings -> flash -> fade -> done

  useEffect(() => {
    const flashTimer = setTimeout(() => {
      setPhase("flash");
      if (onFlash) onFlash();
    }, RING_CONVERGE_DURATION);

    const fadeTimer = setTimeout(() => setPhase("fade"), FLASH_TRIGGER_DELAY);

    const completeTimer = setTimeout(() => {
      setPhase("done");
      if (onComplete) onComplete();
    }, ANIMATION_COMPLETE_DELAY);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onFlash, onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Container for star and rings */}
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

          {/* 3D Saturn-style rings */}
          <div
            style={{
              transform: "perspective(1000px) rotateX(72deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {Array.from({ length: RING_COUNT }).map((_, i) => {
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

      {/* White flash overlay */}
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
}

