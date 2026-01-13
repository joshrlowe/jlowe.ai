/**
 * Mock: three
 * 
 * Mocks Three.js to prevent WebGL context errors in Jest/jsdom.
 * WebGL is not available in the jsdom environment, so we mock
 * all Three.js classes and functions to return empty objects.
 * 
 * This allows components using Three.js to be imported and tested
 * without throwing WebGL-related errors.
 */

// Mock classes with minimal implementations
export class Scene {
  constructor() {
    this.children = [];
    this.background = null;
  }
  add() { return this; }
  remove() { return this; }
  traverse() {}
}

export class PerspectiveCamera {
  constructor() {
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.aspect = 1;
    this.fov = 75;
    this.near = 0.1;
    this.far = 1000;
  }
  updateProjectionMatrix() {}
  lookAt() {}
}

export class OrthographicCamera {
  constructor() {
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
    this.zoom = 1;
  }
  updateProjectionMatrix() {}
}

export class WebGLRenderer {
  constructor() {
    this.domElement = document.createElement('canvas');
    this.shadowMap = { enabled: false, type: null };
  }
  setSize() {}
  setPixelRatio() {}
  render() {}
  dispose() {}
  setClearColor() {}
}

export class Mesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1, set: jest.fn() };
  }
}

export class Group {
  constructor() {
    this.children = [];
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
    this.rotation = { x: 0, y: 0, z: 0 };
  }
  add() { return this; }
  remove() { return this; }
}

export class BoxGeometry {
  constructor() {
    this.parameters = {};
  }
  dispose() {}
}

export class SphereGeometry {
  constructor() {
    this.parameters = {};
  }
  dispose() {}
}

export class PlaneGeometry {
  constructor() {
    this.parameters = {};
  }
  dispose() {}
}

export class BufferGeometry {
  constructor() {
    this.attributes = {};
  }
  setAttribute() { return this; }
  dispose() {}
}

export class BufferAttribute {
  constructor(array, itemSize) {
    this.array = array || new Float32Array(0);
    this.itemSize = itemSize || 1;
    this.count = this.array.length / this.itemSize;
    this.needsUpdate = false;
  }
}

export class Float32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize) {
    super(array, itemSize);
  }
}

export class MeshBasicMaterial {
  constructor(params = {}) {
    Object.assign(this, params);
  }
  dispose() {}
}

export class MeshStandardMaterial {
  constructor(params = {}) {
    Object.assign(this, params);
  }
  dispose() {}
}

export class ShaderMaterial {
  constructor(params = {}) {
    this.uniforms = params.uniforms || {};
  }
  dispose() {}
}

export class PointsMaterial {
  constructor(params = {}) {
    Object.assign(this, params);
  }
  dispose() {}
}

export class Points {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
  }
}

export class Color {
  constructor(color) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
  }
  set() { return this; }
  setHex() { return this; }
}

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) { this.x = x; this.y = y; return this; }
  clone() { return new Vector2(this.x, this.y); }
}

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  normalize() { return this; }
  add() { return this; }
  sub() { return this; }
  multiplyScalar() { return this; }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Quaternion {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 1;
  }
}

export class Clock {
  constructor() {
    this.elapsedTime = 0;
  }
  getElapsedTime() { return this.elapsedTime; }
  getDelta() { return 0.016; }
}

export class TextureLoader {
  load(url, onLoad) {
    const texture = new Texture();
    if (onLoad) setTimeout(() => onLoad(texture), 0);
    return texture;
  }
}

export class Texture {
  constructor() {
    this.image = null;
    this.needsUpdate = false;
  }
  dispose() {}
}

export class AmbientLight {
  constructor() {
    this.intensity = 1;
  }
}

export class DirectionalLight {
  constructor() {
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
    this.intensity = 1;
  }
}

export class PointLight {
  constructor() {
    this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
    this.intensity = 1;
  }
}

// Constants
export const DoubleSide = 2;
export const FrontSide = 0;
export const BackSide = 1;
export const AdditiveBlending = 2;
export const NormalBlending = 1;
export const LinearFilter = 1006;
export const NearestFilter = 1003;
export const RepeatWrapping = 1000;
export const ClampToEdgeWrapping = 1001;
export const sRGBEncoding = 3001;
export const LinearEncoding = 3000;

// Math utilities
export const MathUtils = {
  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  randFloat: (min, max) => min + Math.random() * (max - min),
  randFloatSpread: (range) => range * (0.5 - Math.random()),
  degToRad: (degrees) => degrees * (Math.PI / 180),
  radToDeg: (radians) => radians * (180 / Math.PI),
};

// Default export for ES module compatibility
export default {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  Mesh,
  Group,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  PointsMaterial,
  Points,
  Color,
  Vector2,
  Vector3,
  Euler,
  Quaternion,
  Clock,
  TextureLoader,
  Texture,
  AmbientLight,
  DirectionalLight,
  PointLight,
  DoubleSide,
  FrontSide,
  BackSide,
  AdditiveBlending,
  NormalBlending,
  MathUtils,
};



