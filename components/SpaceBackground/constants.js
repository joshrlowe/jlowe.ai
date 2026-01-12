/**
 * Constants for SpaceBackground animations and styling
 */

// Star count and distribution
export const STAR_COUNT = 3500;
export const STAR_MIN_RADIUS = 20;
export const STAR_MAX_RADIUS_FACTOR = 100;

// Animation timing (milliseconds)
export const RING_CONVERGE_DURATION = 1600;
export const FLASH_TRIGGER_DELAY = 1800;
export const ANIMATION_COMPLETE_DELAY = 3300;
export const EXPLOSION_SPEED_FACTOR = 1.25;

// Camera settings
export const CAMERA_POSITION_Z = 18;
export const CAMERA_FOV = 60;

// Mouse reactivity
export const MOUSE_ROTATION_FACTOR_X = 0.15;
export const MOUSE_ROTATION_FACTOR_Y = 0.25;
export const CAMERA_FOLLOW_SPEED = 0.04;
export const ROTATION_LERP_SPEED = 0.03;
export const MOUSE_POSITION_SCALE_X = 8;
export const MOUSE_POSITION_SCALE_Y = 5;

// Star size distribution thresholds
export const STAR_SIZE_THRESHOLDS = {
  LARGE: 0.98,      // 2% of stars are large
  MEDIUM: 0.9,      // 8% medium
  SMALL: 0.7,       // 20% small
};

export const STAR_SIZE_RANGES = {
  LARGE: { min: 5, variance: 4 },
  MEDIUM: { min: 3, variance: 2 },
  SMALL: { min: 1.8, variance: 1.2 },
  TINY: { min: 0.8, variance: 1 },
};

// Rotation speed
export const AMBIENT_ROTATION_SPEED = 0.003;

