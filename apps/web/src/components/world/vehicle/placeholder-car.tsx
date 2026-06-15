/**
 * Placeholder open-wheel car BODY from original primitives (the 4 wheels are
 * physics-driven, rendered separately by Vehicle). Zero IP. A Blender GLB drops
 * in later exporting nodes: `chassis` (this group) + `wheel_FL/FR/RL/RR`.
 */
export function PlaceholderCarBody() {
  return (
    <group name="chassis">
      {/* monocoque */}
      <mesh position={[0, 0, -0.1]} castShadow>
        <boxGeometry args={[0.8, 0.34, 2.6]} />
        <meshStandardMaterial color="#e85d04" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* nose cone */}
      <mesh
        position={[0, -0.04, 1.7]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <coneGeometry args={[0.26, 1.1, 12]} />
        <meshStandardMaterial color="#e85d04" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* airbox / cockpit */}
      <mesh position={[0, 0.3, -0.55]} castShadow>
        <boxGeometry args={[0.4, 0.32, 0.7]} />
        <meshStandardMaterial color="#15110d" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* side pods */}
      <mesh position={[0, -0.02, -0.4]} castShadow>
        <boxGeometry args={[1.5, 0.24, 1.4]} />
        <meshStandardMaterial color="#1b1510" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* front wing */}
      <mesh position={[0, -0.16, 2.0]} castShadow>
        <boxGeometry args={[1.5, 0.04, 0.4]} />
        <meshStandardMaterial color="#0d0a07" roughness={0.6} />
      </mesh>
      {/* rear wing */}
      <mesh position={[0, 0.34, -1.7]} castShadow>
        <boxGeometry args={[1.3, 0.04, 0.45]} />
        <meshStandardMaterial color="#0d0a07" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.16, -1.72]} castShadow>
        <boxGeometry args={[0.06, 0.36, 0.1]} />
        <meshStandardMaterial color="#0d0a07" />
      </mesh>
    </group>
  );
}
