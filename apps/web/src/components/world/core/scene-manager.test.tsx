import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  resolveSceneKey,
  SceneManager,
  type SceneRegistry,
} from "./scene-manager";

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

  it.each(["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"])(
    "renders nothing for the inherited prototype key %s",
    (key) => {
      const { container } = render(
        <SceneManager scenes={scenes} active={key} />,
      );
      expect(container).toBeEmptyDOMElement();
    },
  );
});

describe("resolveSceneKey", () => {
  const scenes: SceneRegistry = {
    circuit: () => null,
    hero: () => null,
  };

  it("returns a registered key unchanged", () => {
    expect(resolveSceneKey("hero", scenes, "circuit")).toBe("hero");
  });

  it("falls back to the default for an unregistered key", () => {
    expect(resolveSceneKey("__nope__", scenes, "circuit")).toBe("circuit");
  });

  it.each(["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"])(
    "falls back to the default for inherited prototype key %s",
    (key) => {
      expect(resolveSceneKey(key, scenes, "circuit")).toBe("circuit");
    },
  );
});
