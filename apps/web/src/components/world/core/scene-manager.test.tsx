import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SceneManager, type SceneRegistry } from "./scene-manager";

describe("SceneManager", () => {
  const scenes: SceneRegistry = {
    alpha: () => <div>alpha scene</div>,
    beta: () => <div>beta scene</div>,
  };

  it("renders only the active scene", () => {
    const { rerender } = render(
      <SceneManager scenes={scenes} active="alpha" />,
    );
    expect(screen.getByText("alpha scene")).toBeInTheDocument();
    expect(screen.queryByText("beta scene")).not.toBeInTheDocument();

    rerender(<SceneManager scenes={scenes} active="beta" />);
    expect(screen.getByText("beta scene")).toBeInTheDocument();
    expect(screen.queryByText("alpha scene")).not.toBeInTheDocument();
  });

  it("renders nothing for an unknown key", () => {
    const { container } = render(
      <SceneManager scenes={scenes} active="missing" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
