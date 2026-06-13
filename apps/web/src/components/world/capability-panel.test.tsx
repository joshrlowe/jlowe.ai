import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CapabilityPanel } from "./capability-panel";

describe("CapabilityPanel", () => {
  it("resolves and displays the detected tier", async () => {
    // jsdom exposes no navigator.gpu and no WebGL2 context → 2D tier.
    render(<CapabilityPanel />);
    await waitFor(() =>
      expect(screen.getByText("Detected tier")).toBeInTheDocument(),
    );
    expect(screen.getByText("2D")).toBeInTheDocument();
  });
});
