import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorldErrorBoundary } from "./world-error-boundary";

function Boom(): never {
  throw new Error("boom");
}

describe("WorldErrorBoundary", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs a caught render error (and its component stack) to
    // console.error; silence the noise so the test output stays clean.
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("renders children when they don't throw", () => {
    render(
      <WorldErrorBoundary fallback={<div>fallback</div>}>
        <div>child</div>
      </WorldErrorBoundary>,
    );

    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("renders the fallback and notifies onError when a child throws", () => {
    const onError = vi.fn();

    render(
      <WorldErrorBoundary fallback={<div>fallback</div>} onError={onError}>
        <Boom />
      </WorldErrorBoundary>,
    );

    expect(screen.getByText("fallback")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("re-arms when resetKey changes (the WebGPU → WebGL2 remount)", () => {
    const { rerender } = render(
      <WorldErrorBoundary fallback={<div>fallback</div>} resetKey="webgpu">
        <Boom />
      </WorldErrorBoundary>,
    );

    expect(screen.getByText("fallback")).toBeInTheDocument();

    // The parent swaps in a recoverable child and bumps resetKey; the boundary
    // must clear its latch and render the fresh attempt rather than stay failed.
    rerender(
      <WorldErrorBoundary fallback={<div>fallback</div>} resetKey="webgl">
        <div>recovered</div>
      </WorldErrorBoundary>,
    );

    expect(screen.getByText("recovered")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });
});
