/**
 * FluidHeatShader — Liquid Heat preview
 *
 * Replaces the cosmic starfield with a real WebGL displacement field.
 * Domain-warped fbm noise drives a black → oxblood → crimson → ember →
 * peak-orange gradient, with a single fuchsia inflection band at the
 * hottest valleys. No new deps: reuses @react-three/fiber + three.
 *
 * Reduced-motion: shader renders one frame at uTime = 0 then halts.
 * Mobile: dpr capped at 1.5; the gradient still reads even when motion
 * frame rate dips, because the shape itself is structurally interesting.
 */

import { useRef, useState, useEffect } from "react";
// Re-exported for clarity: the shader is intentionally side-effecty —
// uniforms are mutated via refs so we don't churn the GPU material.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const HEAT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Domain-warped fbm. Three octaves is plenty for a fluid look at 60fps;
// the second warp pass is what gives it the "convection cell" feel.
const HEAT_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uIntensity; // 0..1, drives saturation + bloom of hot bands
  uniform float uStatic;    // 1.0 when reduced-motion (locks uTime in calc)

  varying vec2 vUv;

  // Hash + value noise. Cheap enough for 3 fbm octaves x 2 warp passes.
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * vnoise(p);
      p *= 2.07;
      amp *= 0.5;
    }
    return v;
  }

  // Smooth color ramp from cold black up through oxblood, crimson,
  // ember, peak orange. Tuned to the audit palette.
  vec3 heatRamp(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.000, 0.000, 0.000);   // abyss black
    vec3 c1 = vec3(0.102, 0.012, 0.024);   // #1a0306 oxblood
    vec3 c2 = vec3(0.616, 0.008, 0.031);   // #9d0208 crimson
    vec3 c3 = vec3(0.910, 0.365, 0.016);   // #e85d04 deep ember
    vec3 c4 = vec3(1.000, 0.451, 0.000);   // #ff7300 peak heat
    vec3 c5 = vec3(1.000, 0.741, 0.290);   // pre-white near-peak

    if (t < 0.18)      return mix(c0, c1, t / 0.18);
    else if (t < 0.42) return mix(c1, c2, (t - 0.18) / 0.24);
    else if (t < 0.68) return mix(c2, c3, (t - 0.42) / 0.26);
    else if (t < 0.90) return mix(c3, c4, (t - 0.68) / 0.22);
    else               return mix(c4, c5, (t - 0.90) / 0.10);
  }

  void main() {
    vec2 uv = vUv;
    // Aspect-correct so flow doesn't squish on landscape monitors.
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    float t = uTime * (1.0 - uStatic);

    // First warp: low-freq drift driving the convection direction.
    vec2 q = vec2(
      fbm(p * 1.4 + vec2(0.0, t * 0.06)),
      fbm(p * 1.4 + vec2(5.2, t * 0.05))
    );

    // Second warp: pointer-influenced higher-freq turbulence. The mouse
    // gives the heat a subtle reactive pull without being a "follow the
    // cursor" gimmick.
    vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);
    vec2 r = vec2(
      fbm(p * 2.0 + q * 3.5 + vec2(1.7, t * 0.18) + mouse * 0.4),
      fbm(p * 2.0 + q * 3.5 + vec2(8.3, t * 0.21) - mouse * 0.4)
    );

    float n = fbm(p * 2.4 + r * 2.6 + vec2(0.0, t * 0.09));

    // Vertical heat bias — bottom of viewport runs hotter, like a forge
    // floor. Top fades toward black. Subtle radial fall-off at edges
    // keeps the headline column readable.
    float verticalHeat = smoothstep(-0.55, 0.55, p.y * -1.0);
    float radialMask   = 1.0 - smoothstep(0.55, 1.05, length(p));

    // Combine: noise carries the structure, vertical bias adds cohesion,
    // intensity slider lets the hero scale heat across mobile/desktop.
    float heat = (n * 0.78 + verticalHeat * 0.34) * radialMask;
    heat = pow(heat, 0.92);
    heat = mix(heat * 0.6, heat, uIntensity);

    vec3 col = heatRamp(heat);

    // Fuchsia inflection: a thin band where heat sits in the hottest
    // valley. This is the only place fuchsia appears in the shader.
    float inflection = smoothstep(0.86, 0.94, heat) *
                        (1.0 - smoothstep(0.94, 0.99, heat));
    col = mix(col, vec3(0.969, 0.145, 0.522), inflection * 0.55);

    // Subtle grain — just enough to keep big gradient bands from banding.
    float grain = (hash(uv * uResolution + t) - 0.5) * 0.025;
    col += grain;

    // Edge vignette to true black (the audit committed to black bg).
    float edge = smoothstep(1.05, 0.55, length(p));
    col *= edge;

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface HeatPlaneProps {
  reducedMotion: boolean;
  intensity: number;
}

function HeatPlane({ reducedMotion, intensity }: HeatPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, gl } = useThree();

  // Pointer parallax — eased toward the actual cursor. We track in
  // normalized device coords (0..1) so the shader can use it directly.
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const easedMouse = useRef(new THREE.Vector2(0.5, 0.5));

  // Build the uniforms once and keep the same object across renders —
  // ShaderMaterial mutates `value` on each useEffect below, so we must
  // not hand it a new uniforms object every render. useState's lazy
  // initializer is the canonical "compute once" primitive for this.
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uIntensity: { value: intensity },
    uStatic: { value: reducedMotion ? 1.0 : 0.0 },
  }));

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uIntensity.value = intensity;
    materialRef.current.uniforms.uStatic.value = reducedMotion ? 1.0 : 0.0;
  }, [intensity, reducedMotion]);

  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      targetMouse.current.set(
        (e.clientX - rect.left) / rect.width,
        // Y inverted — UV.y goes bottom-to-top in our shader convention.
        1.0 - (e.clientY - rect.top) / rect.height,
      );
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, [gl.domElement]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;

    // When reduced motion is set, hold uTime at 0 — the shader still
    // produces a structured frame because its pattern is deterministic.
    if (!reducedMotion) {
      u.uTime.value += delta;
    }

    // Ease pointer influence — a 12% step per frame feels alive without
    // chasing the cursor.
    easedMouse.current.lerp(targetMouse.current, 0.12);
    u.uMouse.value.copy(easedMouse.current);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={HEAT_VERTEX_SHADER}
        fragmentShader={HEAT_FRAGMENT_SHADER}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

interface FluidHeatShaderProps {
  /** 0..1, drives saturation + bloom of hot bands. Default 1.0. */
  intensity?: number;
  /** Force reduced-motion freeze (otherwise listens to media query). */
  forceStatic?: boolean;
  className?: string;
}

export default function FluidHeatShader({
  intensity = 1,
  forceStatic = false,
  className,
}: FluidHeatShaderProps) {
  const [reducedMotion, setReducedMotion] = useState(forceStatic);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR-safe hydration boundary — flip mounted on client so the
    // canvas only mounts after first paint. Same pattern as
    // components/SpaceBackground/index.tsx:48 in this repo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (forceStatic) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReducedMotion(true);
      return;
    }
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [forceStatic]);

  // Cap DPR — fluid sims don't need 3x retina. 1.5 is plenty.
  const dprCap: [number, number] = [1, 1.5];

  if (!mounted) {
    // SSR-safe placeholder — solid black with a faint center warmth so
    // the FOUC isn't a blast of pure black between paint and hydration.
    return (
      <div
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center bottom, rgba(157,2,8,0.18) 0%, rgba(0,0,0,1) 70%)",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={dprCap}
        gl={{
          antialias: false, // shader doesn't benefit from MSAA
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        frameloop={reducedMotion ? "demand" : "always"}
        style={{ background: "#000000" }}
      >
        <HeatPlane reducedMotion={reducedMotion} intensity={intensity} />
      </Canvas>
    </div>
  );
}
