/**
 * Star color generation utilities
 *
 * Realistic night sky star colors with weighted distribution.
 */
import * as THREE from "three";

// Realistic night sky star colors
const STAR_COLORS = [
  new THREE.Color("#CAE8FF"),  // Blue-white (hot stars)
  new THREE.Color("#B8D4F1"),
  new THREE.Color("#A8C8E8"),
  new THREE.Color("#FFFFFF"),  // Pure white
  new THREE.Color("#FFF8F0"),  // Slightly warm white
  new THREE.Color("#FFFDF8"),
  new THREE.Color("#FFF4E8"),
  new THREE.Color("#FFEFD5"),  // Warm white
  new THREE.Color("#FFE4B5"),
  new THREE.Color("#FFD89B"),  // Yellow-white
  new THREE.Color("#FFD2A1"),
  new THREE.Color("#FFBE7D"),  // Orange (cool stars)
  new THREE.Color("#FFB07C"),
];

// Distribution weights (most stars are white/warm white)
const COLOR_WEIGHTS = [2, 2, 3, 20, 18, 15, 12, 10, 8, 5, 3, 1, 1];
const TOTAL_WEIGHT = COLOR_WEIGHTS.reduce((a, b) => a + b, 0);

/**
 * Returns a random star color using weighted distribution
 * Most stars appear white or warm white, fewer are blue or orange
 */
export function getWeightedStarColor() {
  let random = Math.random() * TOTAL_WEIGHT;
  
  for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
    random -= COLOR_WEIGHTS[i];
    if (random <= 0) return STAR_COLORS[i];
  }
  
  return STAR_COLORS[3]; // Default to pure white
}

