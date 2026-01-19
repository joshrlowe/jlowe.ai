/**
 * Tests for usePrefersReducedMotion hook
 *
 * Tests motion preference detection for accessibility.
 */

import { renderHook, act } from "@testing-library/react";
import { usePrefersReducedMotion, getPrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

describe("usePrefersReducedMotion", () => {
  let originalMatchMedia;
  let mockMediaQueryList;
  let changeHandler;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    changeHandler = null;

    mockMediaQueryList = {
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: jest.fn((event, handler) => {
        if (event === "change") {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    };

    window.matchMedia = jest.fn(() => mockMediaQueryList);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("should return false when user prefers normal motion", () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });

  it("should return true when user prefers reduced motion", () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it("should query the correct media query", () => {
    renderHook(() => usePrefersReducedMotion());

    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("should add event listener for preference changes", () => {
    renderHook(() => usePrefersReducedMotion());

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("should remove event listener on unmount", () => {
    const { unmount } = renderHook(() => usePrefersReducedMotion());

    unmount();

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("should update when preference changes to reduced motion", () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);

    // Simulate preference change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it("should update when preference changes to normal motion", () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);

    // Simulate preference change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: false });
      }
    });

    expect(result.current).toBe(false);
  });
});

describe("getPrefersReducedMotion", () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("should return false when user prefers normal motion", () => {
    window.matchMedia = jest.fn(() => ({ matches: false }));

    const result = getPrefersReducedMotion();

    expect(result).toBe(false);
  });

  it("should return true when user prefers reduced motion", () => {
    window.matchMedia = jest.fn(() => ({ matches: true }));

    const result = getPrefersReducedMotion();

    expect(result).toBe(true);
  });

  it("should query the correct media query", () => {
    window.matchMedia = jest.fn(() => ({ matches: false }));

    getPrefersReducedMotion();

    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("should return false when window is undefined (SSR)", () => {
    const originalWindow = global.window;
    
    // Temporarily make window undefined
    delete global.window;

    const result = getPrefersReducedMotion();

    expect(result).toBe(false);

    // Restore window
    global.window = originalWindow;
  });
});

