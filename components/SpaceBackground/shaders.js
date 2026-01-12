/**
 * WebGL shaders for star rendering
 *
 * Static star shaders with varied sizes and realistic night sky colors.
 */

export const starVertexShader = `
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

export const starFragmentShader = `
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

