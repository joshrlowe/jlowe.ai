/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";

// A device without WebGL makes the fiber Canvas throw while mounting.
jest.mock("@react-three/fiber", () => ({
  Canvas: () => {
    throw new Error("THREE.WebGLRenderer: Error creating WebGL context.");
  },
}));
jest.mock("@/components/SpaceBackground/CosmicStarfield", () => () => null);
jest.mock("@/components/SpaceBackground/CameraController", () => () => null);
jest.mock("@/components/SpaceBackground/SupernovaFlash", () => () => (
  <div data-testid="supernova-flash" />
));

import SpaceBackground from "@/components/SpaceBackground";

describe("SpaceBackground without WebGL", () => {
  let consoleError;

  beforeEach(() => {
    sessionStorage.clear();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    // React logs the caught error; keep the test output readable.
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("falls back to the static starfield instead of throwing", async () => {
    const { container, queryByTestId } = render(<SpaceBackground />);

    await waitFor(() => {
      expect(container.querySelector(".opacity-70")).toBeInTheDocument();
    });
    expect(queryByTestId("supernova-flash")).not.toBeInTheDocument();
  });

  it("releases the intro gate so page content is revealed", async () => {
    const onComplete = jest.fn();
    window.addEventListener("introAnimationComplete", onComplete);

    render(<SpaceBackground />);

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(sessionStorage.getItem("introAnimationPlayed")).toBe("true");
    window.removeEventListener("introAnimationComplete", onComplete);
  });
});
