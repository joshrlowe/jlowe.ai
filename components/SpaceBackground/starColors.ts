import * as THREE from "three";

const STAR_COLORS: THREE.Color[] = [
  new THREE.Color("#CAE8FF"),
  new THREE.Color("#B8D4F1"),
  new THREE.Color("#A8C8E8"),
  new THREE.Color("#FFFFFF"),
  new THREE.Color("#FFF8F0"),
  new THREE.Color("#FFFDF8"),
  new THREE.Color("#FFF4E8"),
  new THREE.Color("#FFEFD5"),
  new THREE.Color("#FFE4B5"),
  new THREE.Color("#FFD89B"),
  new THREE.Color("#FFD2A1"),
  new THREE.Color("#FFBE7D"),
  new THREE.Color("#FFB07C"),
];

const COLOR_WEIGHTS = [2, 2, 3, 20, 18, 15, 12, 10, 8, 5, 3, 1, 1];
const TOTAL_WEIGHT = COLOR_WEIGHTS.reduce((a, b) => a + b, 0);

export function getWeightedStarColor(): THREE.Color {
  let random = Math.random() * TOTAL_WEIGHT;

  for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
    random -= COLOR_WEIGHTS[i];
    if (random <= 0) return STAR_COLORS[i];
  }

  return STAR_COLORS[3];
}
