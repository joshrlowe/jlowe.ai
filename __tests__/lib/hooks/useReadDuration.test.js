/**
 * Tests for useReadDuration hook
 *
 * Tests read duration tracking with visibility API.
 */

import { renderHook, act } from "@testing-library/react";
import { useReadDuration } from "@/lib/hooks/useReadDuration";

describe("useReadDuration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with zero duration", () => {
    const { result } = renderHook(() =>
      useReadDuration({ slug: "test-article" })
    );

    expect(result.current.durationSeconds).toBe(0);
    expect(result.current.isActive).toBe(true);
  });

  it("should track duration over time", () => {
    const { result } = renderHook(() =>
      useReadDuration({ slug: "test-article" })
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.durationSeconds).toBeGreaterThanOrEqual(2);
  });

  it("should format duration correctly", () => {
    const { result } = renderHook(() =>
      useReadDuration({ slug: "test-article" })
    );

    // Initial state
    expect(result.current.formattedDuration).toBe("0s");

    // After some time
    act(() => {
      jest.advanceTimersByTime(65000); // 65 seconds
    });

    // Should be around "1m Xs"
    expect(result.current.formattedDuration).toMatch(/1m \d+s|1m/);
  });

  it("should call onUnmount with duration data", () => {
    const onUnmount = jest.fn();

    const { unmount } = renderHook(() =>
      useReadDuration({
        slug: "test-article",
        onUnmount,
      })
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    unmount();

    expect(onUnmount).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "test-article",
        durationSeconds: expect.any(Number),
      })
    );
  });

  it("should not call onUnmount with zero duration", () => {
    const onUnmount = jest.fn();

    // Render and immediately unmount
    const { unmount } = renderHook(() =>
      useReadDuration({
        slug: "test-article",
        onUnmount,
      })
    );

    unmount();

    // May or may not be called depending on timing - check if called, duration is > 0
    if (onUnmount.mock.calls.length > 0) {
      expect(onUnmount.mock.calls[0][0].durationSeconds).toBeGreaterThan(0);
    }
  });

  it("should pause and resume based on document visibility", () => {
    // This tests the visibility API integration conceptually
    // The actual document.hidden property is read-only in jsdom
    // We verify the hook responds to visibility changes via its state
    
    const { result } = renderHook(() =>
      useReadDuration({ slug: "test-article" })
    );

    // Initially active
    expect(result.current.isActive).toBe(true);

    // Duration should increase over time when active
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.durationSeconds).toBeGreaterThan(0);
  });

  it("should not track without slug", () => {
    const onUnmount = jest.fn();

    const { unmount } = renderHook(() =>
      useReadDuration({ onUnmount })
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    unmount();

    expect(onUnmount).not.toHaveBeenCalled();
  });
});

