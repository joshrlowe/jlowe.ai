"use client";

/**
 * Golden-hour lighting — a pure-light rig. We deliberately avoid drei's
 * `<Environment>`: it PMREM-bakes its `<Lightformer>` children through a GLSL
 * `ShaderMaterial`, which the WebGPU NodeBuilder rejects ("Material
 * ShaderMaterial is not compatible"). Instead: hemisphere ambient (cool sky ↔
 * warm ground bounce) + a warm low key sun + a cool sky-fill rim. Original,
 * zero HDR/asset bytes, identical on both backends.
 */
export function GoldenHourEnvironment() {
  return (
    <>
      <color attach="background" args={["#241405"]} />
      <hemisphereLight args={["#8a74b0", "#3a2410", 0.8]} />
      <ambientLight intensity={0.22} color="#ffb877" />
      <directionalLight
        position={[-50, 14, 18]}
        intensity={2.8}
        color="#ff9b4a"
      />
      <directionalLight
        position={[24, 26, -34]}
        intensity={0.7}
        color="#6b5a8c"
      />
    </>
  );
}
