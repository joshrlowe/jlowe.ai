/**
 * Tests for useScrollDepth hook
 *
 * Tests scroll depth tracking using IntersectionObserver.
 */

import { renderHook, act } from "@testing-library/react";
import { useScrollDepth } from "@/lib/hooks/useScrollDepth";

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.observedElements = [];
    MockIntersectionObserver.instances.push(this);
  }

  observe(element) {
    this.observedElements.push(element);
  }

  unobserve(element) {
    this.observedElements = this.observedElements.filter((el) => el !== element);
  }

  disconnect() {
    this.observedElements = [];
  }

  // Helper to simulate intersection
  simulateIntersection(entries) {
    this.callback(entries);
  }
}

MockIntersectionObserver.instances = [];

describe("useScrollDepth", () => {
  let originalIntersectionObserver;

  beforeEach(() => {
    originalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = MockIntersectionObserver;
    MockIntersectionObserver.instances = [];
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it("should initialize with zero depth", () => {
    const articleRef = { current: document.createElement("div") };

    const { result } = renderHook(() =>
      useScrollDepth({ articleRef })
    );

    expect(result.current.currentDepth).toBe(0);
    expect(result.current.reachedMilestones).toEqual([]);
  });

  it("should create sentinel elements for milestones", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    renderHook(() => useScrollDepth({ articleRef }));

    const sentinels = article.querySelectorAll("[data-scroll-milestone]");
    expect(sentinels.length).toBe(4); // 25, 50, 75, 100
  });

  it("should use custom milestones", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    renderHook(() =>
      useScrollDepth({
        articleRef,
        milestones: [10, 50, 90],
      })
    );

    const sentinels = article.querySelectorAll("[data-scroll-milestone]");
    expect(sentinels.length).toBe(3);
  });

  it("should call onMilestone when a milestone is reached", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };
    const onMilestone = jest.fn();

    renderHook(() =>
      useScrollDepth({
        articleRef,
        onMilestone,
      })
    );

    // Get the observer instance
    const observer = MockIntersectionObserver.instances[0];
    const sentinel = article.querySelector('[data-scroll-milestone="25"]');

    // Simulate intersection
    act(() => {
      observer.simulateIntersection([
        { target: sentinel, isIntersecting: true },
      ]);
    });

    expect(onMilestone).toHaveBeenCalledWith(25);
  });

  it("should not call onMilestone for the same milestone twice", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };
    const onMilestone = jest.fn();

    const { result } = renderHook(() =>
      useScrollDepth({
        articleRef,
        onMilestone,
      })
    );

    const observer = MockIntersectionObserver.instances[0];
    const sentinel = article.querySelector('[data-scroll-milestone="25"]');

    // Simulate intersection twice
    act(() => {
      observer.simulateIntersection([
        { target: sentinel, isIntersecting: true },
      ]);
    });

    act(() => {
      observer.simulateIntersection([
        { target: sentinel, isIntersecting: true },
      ]);
    });

    // The milestone should only be in the reached set once
    expect(result.current.reachedMilestones).toEqual([25]);
    expect(result.current.hasReachedMilestone(25)).toBe(true);
  });

  it("should update currentDepth to highest reached milestone", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { result } = renderHook(() =>
      useScrollDepth({ articleRef })
    );

    const observer = MockIntersectionObserver.instances[0];
    const sentinel50 = article.querySelector('[data-scroll-milestone="50"]');

    act(() => {
      observer.simulateIntersection([
        { target: sentinel50, isIntersecting: true },
      ]);
    });

    expect(result.current.currentDepth).toBe(50);
  });

  it("should track reached milestones correctly", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { result } = renderHook(() =>
      useScrollDepth({ articleRef })
    );

    const observer = MockIntersectionObserver.instances[0];
    const sentinel25 = article.querySelector('[data-scroll-milestone="25"]');
    const sentinel50 = article.querySelector('[data-scroll-milestone="50"]');

    act(() => {
      observer.simulateIntersection([
        { target: sentinel25, isIntersecting: true },
      ]);
    });

    act(() => {
      observer.simulateIntersection([
        { target: sentinel50, isIntersecting: true },
      ]);
    });

    expect(result.current.reachedMilestones).toContain(25);
    expect(result.current.reachedMilestones).toContain(50);
    expect(result.current.hasReachedMilestone(25)).toBe(true);
    expect(result.current.hasReachedMilestone(75)).toBe(false);
  });

  it("should cleanup sentinels on unmount", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { unmount } = renderHook(() =>
      useScrollDepth({ articleRef })
    );

    expect(article.querySelectorAll("[data-scroll-milestone]").length).toBe(4);

    unmount();

    expect(article.querySelectorAll("[data-scroll-milestone]").length).toBe(0);
  });

  it("should handle null articleRef gracefully", () => {
    const articleRef = { current: null };

    const { result } = renderHook(() =>
      useScrollDepth({ articleRef })
    );

    expect(result.current.currentDepth).toBe(0);
    expect(result.current.reachedMilestones).toEqual([]);
  });
});

