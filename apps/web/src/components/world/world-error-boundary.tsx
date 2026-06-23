"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered instead of the children once a descendant has thrown. */
  fallback: ReactNode;
  /** Notified once per catch so the parent can degrade (lower tier / 2D). */
  onError?: (error: unknown) => void;
  /**
   * When this value changes the boundary re-arms (renders children again).
   * The parent bumps it after swapping in a recoverable child — e.g. remounting
   * the canvas at a lower tier — so a fresh attempt isn't masked by the latch.
   */
  resetKey?: unknown;
}

interface State {
  failed: boolean;
}

/**
 * Catches any render/commit error in the 3D subtree — including a rejected
 * `WebGPURenderer.init()` that R3F surfaces while committing the <Canvas> — so a
 * GPU failure degrades gracefully instead of white-screening. The boundary is
 * policy-free: the parent decides what `fallback` is and what `onError` does
 * (step down a tier, or bounce to the 2D site), and re-arms it via `resetKey`.
 */
export class WorldErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    this.props.onError?.(error);
  }

  override componentDidUpdate(prev: Props): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
