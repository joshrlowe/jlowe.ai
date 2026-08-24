import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

// The SES client is constructed at module scope, so it has to be mocked before
// the handler module is imported (done per-test via a dynamic import below).
vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = send;
  },
  SendEmailCommand: class {
    constructor(public input: unknown) {}
  },
}));

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would like to talk about an analytical engine.",
};

function event(body: unknown): APIGatewayProxyEventV2 {
  return { body: JSON.stringify(body) } as APIGatewayProxyEventV2;
}

async function loadHandler() {
  process.env.CONTACT_FROM_ADDRESS = "contact@jlowe.ai";
  process.env.CONTACT_TO_ADDRESS = "owner@example.com";
  const mod = await import("./handler.js");
  return mod.handler;
}

beforeEach(() => {
  vi.resetModules();
  send.mockReset();
  // Structured logs are the handler's observability contract, not test noise.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("contact handler", () => {
  it("sends the email and returns { ok: true } for a valid submission", async () => {
    send.mockResolvedValue({ MessageId: "abc" });
    const handler = await loadHandler();

    const res = await handler(event(valid));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(String(res.body))).toEqual({ ok: true });
    expect(res.headers?.["content-type"]).toContain("application/json");
    expect(send).toHaveBeenCalledTimes(1);

    const command = send.mock.calls[0]?.[0] as { input: Record<string, never> };
    expect(command.input).toMatchObject({
      FromEmailAddress: "contact@jlowe.ai",
      Destination: { ToAddresses: ["owner@example.com"] },
      // Replying to the notification must reach the visitor.
      ReplyToAddresses: ["ada@example.com"],
    });
  });

  it("fails closed on invalid input: 400, nothing sent", async () => {
    const handler = await loadHandler();

    const res = await handler(event({ ...valid, email: "nope" }));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(String(res.body)).ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("silently 200s a filled honeypot without sending", async () => {
    const handler = await loadHandler();

    const res = await handler(event({ ...valid, company: "Acme Spam Co" }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(String(res.body))).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("fails safe on an SES error: 502 + friendly message + structured log", async () => {
    send.mockRejectedValue(new Error("Throttling: Maximum sending rate"));
    const handler = await loadHandler();

    const res = await handler(event(valid));

    expect(res.statusCode).toBe(502);
    const body = JSON.parse(String(res.body));
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/email me directly/i);
    // The failure is observable as one JSON line in CloudWatch.
    const logged = vi.mocked(console.error).mock.calls.at(-1)?.[0];
    expect(JSON.parse(String(logged))).toMatchObject({
      level: "error",
      msg: "contact_send_failed",
    });
  });
});
