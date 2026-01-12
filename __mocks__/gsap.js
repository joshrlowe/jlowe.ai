/**
 * Mock: gsap (GreenSock Animation Platform)
 * 
 * Mocks GSAP animation library for testing.
 * Uses plain functions instead of jest.fn() to avoid initialization issues.
 */

const noop = () => {};
const returnThis = function() { return this; };
const returnMock = function() { return mockTween; };

// Mock tween object returned by animation methods
const mockTween = {
  kill: noop,
  pause: noop,
  play: noop,
  resume: noop,
  restart: noop,
  reverse: noop,
  seek: noop,
  progress: returnThis,
  totalProgress: returnThis,
  duration: () => 0,
  totalDuration: () => 0,
  time: () => 0,
  totalTime: () => 0,
  isActive: () => false,
  then: (cb) => {
    if (cb) cb();
    return Promise.resolve();
  },
};

// Mock timeline object
const mockTimeline = {
  ...mockTween,
  to: returnThis,
  from: returnThis,
  fromTo: returnThis,
  set: returnThis,
  call: returnThis,
  add: returnThis,
  addLabel: returnThis,
  addPause: returnThis,
  clear: returnThis,
};

// Main gsap object
const gsap = {
  to: returnMock,
  from: returnMock,
  fromTo: returnMock,
  set: returnMock,
  timeline: () => mockTimeline,
  killTweensOf: noop,
  getTweensOf: () => [],
  getProperty: () => 0,
  quickSetter: () => noop,
  quickTo: () => noop,
  isTweening: () => false,
  registerPlugin: noop,
  registerEffect: noop,
  core: { globals: noop },
  defaults: returnThis,
  config: returnThis,
  context: (fn) => {
    if (fn) fn();
    return { add: noop, revert: noop, kill: noop, clear: noop };
  },
  selector: () => () => [],
  matchMedia: () => ({ add: noop, revert: noop, kill: noop }),
  delayedCall: returnMock,
  effects: {},
  ticker: {
    add: noop,
    remove: noop,
    fps: noop,
    deltaRatio: () => 1,
    frame: 0,
    time: 0,
  },
  globalTimeline: mockTimeline,
  exportRoot: () => mockTimeline,
};

// Export common plugins as mocks
export const ScrollTrigger = {
  create: () => ({ kill: noop, enable: noop, disable: noop, refresh: noop }),
  refresh: noop,
  update: noop,
  getAll: () => [],
  getById: noop,
  kill: noop,
  enable: noop,
  disable: noop,
  defaults: noop,
  config: noop,
  scrollerProxy: noop,
  clearScrollMemory: noop,
  maxScroll: () => 0,
  getVelocity: () => 0,
  isScrolling: () => false,
  batch: () => [],
  addEventListener: noop,
  removeEventListener: noop,
};

export const Observer = {
  create: () => ({ kill: noop, enable: noop, disable: noop }),
};

export const Draggable = {
  create: () => [],
  get: noop,
  hitTest: () => false,
};

export const MotionPathPlugin = {
  convertToPath: noop,
  getRelativePosition: noop,
  arrayToRawPath: noop,
  rawPathToString: noop,
};

export const TextPlugin = {};

export const SplitText = function() {
  return { chars: [], words: [], lines: [], revert: noop };
};

// Export default gsap object
export default gsap;

// Named export for ES modules
export { gsap };
