import { describe, expect, it } from "vitest";

import {
  bookMeetingTool,
  getCalcomBookingUrl,
  isCalcomConfigured,
  shouldExposeBookingTool,
} from "./tools.js";

describe("bookMeetingTool Converse wrapping", () => {
  it("nests the spec under toolSpec (not the raw Anthropic tools[])", () => {
    expect(bookMeetingTool.toolSpec?.name).toBe("book_meeting");
    expect(bookMeetingTool.toolSpec?.inputSchema).toBeDefined();
    expect((bookMeetingTool as { name?: string }).name).toBeUndefined();
  });
});

describe("getCalcomBookingUrl", () => {
  it("returns null when CALCOM_USERNAME is missing (fail closed)", () => {
    expect(
      getCalcomBookingUrl(
        { topicSummary: "need a twin" },
        { CALCOM_EVENT_TYPE_SLUG: "30min" },
      ),
    ).toBeNull();
    expect(isCalcomConfigured({})).toBe(false);
  });

  it("builds a prefilled cal.com URL when configured", () => {
    const env = {
      CALCOM_USERNAME: "joshlowe",
      CALCOM_EVENT_TYPE_SLUG: "30min",
    };
    expect(isCalcomConfigured(env)).toBe(true);
    expect(
      getCalcomBookingUrl(
        {
          topicSummary: "RAG chat funnel",
          name: "Ada",
          email: "ada@example.com",
        },
        env,
      ),
    ).toBe(
      "https://cal.com/joshlowe/30min?name=Ada&email=ada%40example.com&notes=RAG+chat+funnel",
    );
  });
});

describe("shouldExposeBookingTool", () => {
  const base = {
    qualified: false,
    bookingOffered: false,
    intent: "researching" as const,
    calcomConfigured: true,
  };

  it("is true only for (qualified || evaluating) && !bookingOffered && calcom", () => {
    expect(shouldExposeBookingTool(base)).toBe(false);
    expect(shouldExposeBookingTool({ ...base, intent: "evaluating" })).toBe(
      true,
    );
    expect(shouldExposeBookingTool({ ...base, qualified: true })).toBe(true);
    expect(
      shouldExposeBookingTool({
        ...base,
        intent: "evaluating",
        bookingOffered: true,
      }),
    ).toBe(false);
    expect(
      shouldExposeBookingTool({
        ...base,
        intent: "evaluating",
        calcomConfigured: false,
      }),
    ).toBe(false);
  });
});
