import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { describe, expect, it } from "vitest";

import {
  COOKIE_NAME,
  getOrMintSessionId,
  parseSessionId,
  sessionCookieHeader,
} from "./cookie.js";

function event(
  partial: Partial<APIGatewayProxyEventV2> = {},
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "POST /",
    rawPath: "/",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "1",
      apiId: "api",
      domainName: "example.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "example",
      http: {
        method: "POST",
        path: "/",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "req",
      routeKey: "POST /",
      stage: "$default",
      time: "now",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
    ...partial,
  };
}

const VALID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("parseSessionId", () => {
  it("reads a valid id from event.cookies", () => {
    expect(
      parseSessionId(event({ cookies: [`${COOKIE_NAME}=${VALID}`] })),
    ).toBe(VALID);
  });

  it("reads a valid id from the Cookie header (either case)", () => {
    expect(
      parseSessionId(event({ headers: { cookie: `${COOKIE_NAME}=${VALID}` } })),
    ).toBe(VALID);
    expect(
      parseSessionId(event({ headers: { Cookie: `${COOKIE_NAME}=${VALID}` } })),
    ).toBe(VALID);
  });

  it("rejects a missing, malformed, or non-UUID value", () => {
    expect(parseSessionId(event())).toBeUndefined();
    expect(
      parseSessionId(event({ cookies: [`${COOKIE_NAME}=not-a-uuid`] })),
    ).toBeUndefined();
    expect(
      parseSessionId(event({ headers: { cookie: "other=thing" } })),
    ).toBeUndefined();
  });
});

describe("sessionCookieHeader", () => {
  it("is HttpOnly, Secure, SameSite=Lax, Path=/, 30-day Max-Age", () => {
    const header = sessionCookieHeader(VALID);
    expect(header).toContain(`${COOKIE_NAME}=${VALID}`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(header).toContain("Max-Age=2592000");
  });
});

describe("getOrMintSessionId", () => {
  it("returns the existing valid id and otherwise mints a UUID", () => {
    expect(
      getOrMintSessionId(event({ cookies: [`${COOKIE_NAME}=${VALID}`] })),
    ).toBe(VALID);
    const minted = getOrMintSessionId(event());
    expect(minted).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(minted).not.toBe(VALID);
  });
});
