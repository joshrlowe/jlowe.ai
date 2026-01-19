/**
 * Tests for useReadingAnalytics hook
 *
 * Integration tests for the combined reading analytics hook.
 */

import { renderHook, act } from "@testing-library/react";
import { useReadingAnalytics } from "@/lib/hooks/useReadingAnalytics";

// Mock the analytics module
jest.mock("@/lib/analytics", () => ({
  trackArticleView: jest.fn(),
  trackScrollDepth: jest.fn(),
  trackReadDuration: jest.fn(),
}));

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

  simulateIntersection(entries) {
    this.callback(entries);
  }
}

MockIntersectionObserver.instances = [];

describe("useReadingAnalytics", () => {
  let originalIntersectionObserver;
  let analytics;

  beforeEach(() => {
    jest.useFakeTimers();
    originalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = MockIntersectionObserver;
    MockIntersectionObserver.instances = [];

    // Get the mocked analytics module
    analytics = require("@/lib/analytics");
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it("should track article view on mount", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    renderHook(() =>
      useReadingAnalytics({
        articleRef,
        slug: "test-article",
        topic: "javascript",
        readingTime: 5,
      })
    );

    expect(analytics.trackArticleView).toHaveBeenCalledWith({
      slug: "test-article",
      topic: "javascript",
      readingTime: 5,
    });
  });

  it("should only track article view once", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { rerender } = renderHook(() =>
      useReadingAnalytics({
        articleRef,
        slug: "test-article",
        topic: "javascript",
        readingTime: 5,
      })
    );

    rerender();
    rerender();

    expect(analytics.trackArticleView).toHaveBeenCalledTimes(1);
  });

  it("should track scroll depth milestones", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    renderHook(() =>
      useReadingAnalytics({
        articleRef,
        slug: "test-article",
        topic: "javascript",
        readingTime: 5,
      })
    );

    // Get the observer and simulate scroll
    const observer = MockIntersectionObserver.instances[0];
    const sentinel = article.querySelector('[data-scroll-milestone="50"]');

    act(() => {
      observer.simulateIntersection([
        { target: sentinel, isIntersecting: true },
      ]);
    });

    expect(analytics.trackScrollDepth).toHaveBeenCalledWith({
      slug: "test-article",
      depth: 50,
    });
  });

  it("should track read duration on unmount", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { unmount } = renderHook(() =>
      useReadingAnalytics({
        articleRef,
        slug: "test-article",
        topic: "javascript",
        readingTime: 5,
      })
    );

    // Simulate reading for 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    unmount();

    expect(analytics.trackReadDuration).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "test-article",
        durationSeconds: expect.any(Number),
        completed: expect.any(Boolean),
      })
    );
  });

  it("should return combined state", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { result } = renderHook(() =>
      useReadingAnalytics({
        articleRef,
        slug: "test-article",
        topic: "javascript",
        readingTime: 5,
      })
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        currentDepth: expect.any(Number),
        reachedMilestones: expect.any(Array),
        hasReachedMilestone: expect.any(Function),
        durationSeconds: expect.any(Number),
        isActive: expect.any(Boolean),
        formattedDuration: expect.any(String),
      })
    );
  });

  it("should handle missing props gracefully", () => {
    const articleRef = { current: null };

    const { result } = renderHook(() =>
      useReadingAnalytics({
        articleRef,
      })
    );

    expect(result.current.currentDepth).toBe(0);
    expect(analytics.trackArticleView).not.toHaveBeenCalled();
  });

  it("should mark article as completed when 100% reached", () => {
    const article = document.createElement("div");
    const articleRef = { current: article };

    const { unmount } = renderHook(() =>
      useReadingAnalytics({
        articleRef,
        slug: "test-article",
        topic: "javascript",
        readingTime: 5,
      })
    );

    // Simulate reaching 100%
    const observer = MockIntersectionObserver.instances[0];
    const sentinel = article.querySelector('[data-scroll-milestone="100"]');

    act(() => {
      observer.simulateIntersection([
        { target: sentinel, isIntersecting: true },
      ]);
    });

    // Simulate some reading time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    unmount();

    expect(analytics.trackReadDuration).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
      })
    );
  });
});

