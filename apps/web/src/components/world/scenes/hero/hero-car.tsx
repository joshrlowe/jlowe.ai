"use client";

import { HeroModel } from "./hero-model";

const CAR_URL = "/assets/car/sports-car.glb";

/**
 * The curated CC0 sports car, the prominent foreground subject. Standard GLB
 * materials at this stage (clearcoat paint is a later feature). Faces +z, sat
 * on the road at the origin.
 */
export function HeroCar() {
  return <HeroModel url={CAR_URL} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />;
}
