/**
 * @jest-environment node
 *
 * SSR-safety for the analytics utility. jsdom 26 makes `window`
 * non-configurable, so the no-window case runs under the real node
 * environment instead of redefining the global in the jsdom suite.
 */

import { track } from "@vercel/analytics";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

jest.mock("@vercel/analytics");

describe("Analytics Utility (SSR)", () => {
  it("does not call track when window is undefined", () => {
    expect(typeof window).toBe("undefined");

    trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {});

    expect(track).not.toHaveBeenCalled();
  });
});
