import { describe, expect, it } from "vitest";

import type { CitationItem } from "./citations.js";
import {
  assertCitationIntegrity,
  assertGroundingRefusal,
  isExportedCitationUrl,
} from "./eval-probes.js";

describe("assertGroundingRefusal", () => {
  it("accepts the shipped I-don't-know line", () => {
    expect(() =>
      assertGroundingRefusal(
        "I don't have that in Josh's notes — the surest way to get a precise answer is the contact page.",
      ),
    ).not.toThrow();
  });

  it("rejects an invented Google founding", () => {
    expect(() =>
      assertGroundingRefusal(
        "Josh founded Google in 1998 and is the CEO of Google.",
      ),
    ).toThrow(/invented/);
  });

  it("does not treat a negated 'did not found Google' as invention", () => {
    expect(() =>
      assertGroundingRefusal(
        "I don't have that in Josh's notes — he did not found Google. The contact page is the surest next step.",
      ),
    ).not.toThrow();
  });

  it("rejects a confident answer that never declines", () => {
    expect(() =>
      assertGroundingRefusal(
        "Josh has been shipping production AI systems for years.",
      ),
    ).toThrow(/neither declined/);
  });
});

describe("assertCitationIntegrity", () => {
  const items: CitationItem[] = [
    {
      index: 1,
      title: "Jarvis",
      url: "/projects/jarvis/",
      snippet: "self-hosted",
    },
  ];

  it("accepts [1] when item 1 exists and the URL is an exported path", () => {
    expect(() =>
      assertCitationIntegrity("Jarvis is a self-hosted assistant [1].", items),
    ).not.toThrow();
  });

  it("rejects a dangling [2]", () => {
    expect(() => assertCitationIntegrity("Also see [2].", items)).toThrow(
      /\[2\]/,
    );
  });

  it("rejects a non-exported URL", () => {
    expect(() =>
      assertCitationIntegrity("Hi [1].", [
        { ...items[0]!, url: "https://evil.example/" },
      ]),
    ).toThrow(/exported path/);
  });
});

describe("isExportedCitationUrl", () => {
  it("allows trailingSlash project/article/about paths", () => {
    expect(isExportedCitationUrl("/projects/jarvis/")).toBe(true);
    expect(isExportedCitationUrl("/articles/x/")).toBe(true);
    expect(isExportedCitationUrl("/about/")).toBe(true);
  });

  it("rejects protocol-relative and parent-path tricks", () => {
    expect(isExportedCitationUrl("//evil.example/")).toBe(false);
    expect(isExportedCitationUrl("/projects/../secret/")).toBe(false);
    expect(isExportedCitationUrl("/projects/jarvis")).toBe(false);
  });
});
