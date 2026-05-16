import {
  decide,
  HOLD_THRESHOLD,
  REJECT_THRESHOLD,
  OFFTOPIC_HOLD_THRESHOLD,
} from "../../../lib/moderation/policy";

const baseScores = {
  spam: 0,
  toxicity: 0,
  offTopic: 0,
  pii: 0,
  summary: "ok",
};

describe("moderation policy.decide", () => {
  it("approves all-zero scores", () => {
    expect(decide(baseScores)).toEqual({ status: "approved" });
  });

  it("approves scores just below the hold threshold", () => {
    const r = decide({
      ...baseScores,
      spam: HOLD_THRESHOLD - 0.0001,
      toxicity: HOLD_THRESHOLD - 0.0001,
      pii: HOLD_THRESHOLD - 0.0001,
      offTopic: OFFTOPIC_HOLD_THRESHOLD - 0.0001,
    });
    expect(r.status).toBe("approved");
  });

  it("holds at exactly the spam hold threshold", () => {
    const r = decide({ ...baseScores, spam: HOLD_THRESHOLD });
    expect(r.status).toBe("held");
    if (r.status === "held") expect(r.reason).toMatch(/spam=0\.40/);
  });

  it("holds when off-topic crosses its softer threshold", () => {
    const r = decide({ ...baseScores, offTopic: OFFTOPIC_HOLD_THRESHOLD });
    expect(r.status).toBe("held");
    if (r.status === "held") expect(r.reason).toMatch(/offTopic=0\.70/);
  });

  it("rejects at exactly the reject threshold on toxicity", () => {
    const r = decide({ ...baseScores, toxicity: REJECT_THRESHOLD });
    expect(r.status).toBe("rejected");
    if (r.status === "rejected") expect(r.reason).toMatch(/toxicity=0\.80/);
  });

  it("rejects on PII reaching the reject band even when other axes are clean", () => {
    expect(decide({ ...baseScores, pii: 0.95 }).status).toBe("rejected");
  });

  it("reject takes precedence over hold when multiple axes fire", () => {
    const r = decide({
      ...baseScores,
      spam: 0.5, // hold
      toxicity: 0.9, // reject
    });
    expect(r.status).toBe("rejected");
    if (r.status === "rejected") expect(r.reason).toContain("toxicity");
  });

  it("hold reason concatenates every axis that fired", () => {
    const r = decide({
      ...baseScores,
      spam: 0.5,
      pii: 0.5,
      offTopic: 0.8,
    });
    expect(r.status).toBe("held");
    if (r.status === "held") {
      expect(r.reason).toContain("spam=");
      expect(r.reason).toContain("pii=");
      expect(r.reason).toContain("offTopic=");
    }
  });

  it("off-topic alone below 0.7 stays approved (softer band)", () => {
    expect(decide({ ...baseScores, offTopic: 0.69 }).status).toBe("approved");
  });
});
