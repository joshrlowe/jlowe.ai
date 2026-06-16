"use client";

/**
 * A detailed road wheel — black rubber tire + a metallic five-spoke rim with a
 * hub cap — built from primitives (zero IP, zero asset bytes). The axle runs
 * along X (matching WHEEL_AXLE), so the cylinders are rotated onto Z and the
 * whole wheel spins/steers via the parent group that Vehicle drives from the
 * physics readback.
 */
export function DetailedWheel({ radius }: { radius: number }) {
  const tireWidth = 0.3;
  const rimRadius = radius * 0.62;
  const spokes = 5;

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* tire — chunky rounded-profile cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, tireWidth, 28]} />
        <meshStandardMaterial
          color="#0a0807"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {/* tire inner sidewall shading rings */}
      <mesh position={[0, tireWidth / 2 + 0.001, 0]}>
        <ringGeometry args={[rimRadius, radius * 0.98, 28]} />
        <meshStandardMaterial color="#050403" roughness={0.9} />
      </mesh>
      <mesh
        position={[0, -tireWidth / 2 - 0.001, 0]}
        rotation={[Math.PI, 0, 0]}
      >
        <ringGeometry args={[rimRadius, radius * 0.98, 28]} />
        <meshStandardMaterial color="#050403" roughness={0.9} />
      </mesh>
      {/* rim barrel */}
      <mesh>
        <cylinderGeometry args={[rimRadius, rimRadius, tireWidth + 0.01, 24]} />
        <meshStandardMaterial
          color="#1b1d22"
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>
      {/* rim face plates (front + back) */}
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={[0, (s * (tireWidth + 0.02)) / 2, 0]}
          rotation={[s === 1 ? 0 : Math.PI, 0, 0]}
        >
          <cylinderGeometry args={[rimRadius, rimRadius, 0.02, 24]} />
          <meshStandardMaterial
            color="#c8ccd2"
            roughness={0.22}
            metalness={0.95}
          />
        </mesh>
      ))}
      {/* spokes */}
      {Array.from({ length: spokes }).map((_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * rimRadius * 0.5,
              0,
              Math.sin(a) * rimRadius * 0.5,
            ]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[rimRadius * 0.9, tireWidth + 0.03, 0.07]} />
            <meshStandardMaterial
              color="#d6dae0"
              roughness={0.25}
              metalness={0.95}
            />
          </mesh>
        );
      })}
      {/* hub cap */}
      <mesh>
        <cylinderGeometry
          args={[rimRadius * 0.32, rimRadius * 0.32, tireWidth + 0.06, 16]}
        />
        <meshStandardMaterial color="#2a2d33" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
}
