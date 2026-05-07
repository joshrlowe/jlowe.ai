import { getCalcomBookingUrl } from "@/lib/chat/tools";

const ORIGINAL_ENV = { ...process.env };

describe("getCalcomBookingUrl", () => {
  beforeEach(() => {
    delete process.env.CALCOM_USERNAME;
    delete process.env.CALCOM_EVENT_TYPE_SLUG;
    process.env.DATABASE_URL = "postgresql://test";
    process.env.NEXTAUTH_SECRET = "secret";
  });
  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns null when CALCOM_USERNAME is missing", () => {
    expect(getCalcomBookingUrl({ topicSummary: "anything" })).toBeNull();
  });

  it("builds a URL with the default event type slug", () => {
    process.env.CALCOM_USERNAME = "joshlowe";
    const url = getCalcomBookingUrl({ topicSummary: "RAG help" });
    expect(url).toBe("https://cal.com/joshlowe/30min?notes=RAG+help");
  });

  it("includes name and email when provided", () => {
    process.env.CALCOM_USERNAME = "joshlowe";
    process.env.CALCOM_EVENT_TYPE_SLUG = "intro-call";
    const url = getCalcomBookingUrl({
      topicSummary: "Customer support bot",
      name: "Sarah",
      email: "sarah@acme.com",
    });
    expect(url).toContain("https://cal.com/joshlowe/intro-call?");
    expect(url).toContain("name=Sarah");
    expect(url).toContain("email=sarah%40acme.com");
    expect(url).toContain("notes=Customer+support+bot");
  });

  it("URL-encodes special characters in topicSummary", () => {
    process.env.CALCOM_USERNAME = "joshlowe";
    const url = getCalcomBookingUrl({
      topicSummary: "Need help with /api/chat & related",
    });
    expect(url).toContain("notes=Need+help+with+%2Fapi%2Fchat+%26+related");
  });
});
