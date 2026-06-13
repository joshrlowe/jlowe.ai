import { afterEach, describe, expect, it, vi } from "vitest";

import { SITE_NAME, siteUrl } from "./site-config";

describe("site-config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exposes the site name", () => {
    expect(SITE_NAME).toBe("Josh Lowe");
  });

  it("defaults to the production origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteUrl().origin).toBe("https://jlowe.ai");
  });

  it("honors NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dev.jlowe.ai");
    expect(siteUrl().origin).toBe("https://dev.jlowe.ai");
  });
});
