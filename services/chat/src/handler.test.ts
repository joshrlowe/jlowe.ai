import { describe, expect, it } from "vitest";

import { handler } from "./handler.js";

describe("chat handler", () => {
  it("returns an ok healthcheck", async () => {
    const result = await handler({} as never, {} as never, () => undefined);
    if (typeof result !== "object" || result === null) {
      throw new Error("expected a structured result");
    }
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? "{}")).toMatchObject({
      service: "chat",
      status: "ok",
    });
  });
});
