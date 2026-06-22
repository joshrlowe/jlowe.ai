import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consumeTwoDNotice,
  queueTwoDNotice,
  TWO_D_NOTICE_EVENT,
} from "./two-d-notice";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("two-d-notice", () => {
  it("consume returns false when nothing is queued", () => {
    expect(consumeTwoDNotice()).toBe(false);
  });

  it("queue then consume returns true exactly once, then clears", () => {
    queueTwoDNotice();
    expect(consumeTwoDNotice()).toBe(true);
    expect(consumeTwoDNotice()).toBe(false);
  });

  it("queue dispatches the window event so a mounted Toaster can flush", () => {
    const handler = vi.fn();
    window.addEventListener(TWO_D_NOTICE_EVENT, handler);
    queueTwoDNotice();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(TWO_D_NOTICE_EVENT, handler);
  });

  it("is best-effort when sessionStorage throws (private mode / disabled)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => queueTwoDNotice()).not.toThrow();
    expect(consumeTwoDNotice()).toBe(false);
  });
});
