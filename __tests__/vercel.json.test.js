/**
 * vercel.json — host-conditional headers and cron schedule.
 *
 * The leftover jlowe-ai.vercel.app hostname must send X-Robots-Tag so it
 * does not duplicate the apex. Public pages stay indexable: e2e SEO tests
 * hit the built app (localhost), not the vercel.app host, and this header
 * is scoped with a host matcher.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const vercel = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8"));

describe("vercel.json", () => {
  it("keeps the qualified-leads digest cron", () => {
    expect(vercel.crons).toEqual([
      {
        path: "/api/cron/qualified-leads-digest",
        schedule: "0 12 * * *",
      },
    ]);
  });

  it("noindexes only jlowe-ai.vercel.app via X-Robots-Tag", () => {
    const noindex = vercel.headers.find((rule) =>
      rule.headers?.some((h) => h.key === "X-Robots-Tag")
    );

    expect(noindex).toBeDefined();
    expect(noindex.source).toBe("/(.*)");
    expect(noindex.has).toEqual([{ type: "host", value: "jlowe-ai.vercel.app" }]);
    expect(noindex.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
  });

  it("does not apply a blanket noindex to every host", () => {
    const unscoped = (vercel.headers ?? []).filter(
      (rule) =>
        rule.headers?.some((h) => h.key === "X-Robots-Tag") &&
        !(rule.has ?? []).some((cond) => cond.type === "host")
    );

    expect(unscoped).toHaveLength(0);
  });
});
