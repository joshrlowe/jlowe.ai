jest.mock("@/lib/email/resend", () => ({
  sendEmail: jest.fn(async () => true),
}));

import handler from "@/pages/api/cron/qualified-leads-digest";
import prisma from "@/__mocks__/prisma";
import { sendEmail } from "@/lib/email/resend";

interface MockRes {
  statusCode: number;
  body: unknown;
  ended: boolean;
  status(code: number): MockRes;
  json(payload: unknown): void;
  end(): void;
  setHeader(): void;
}

function createReq(headers: Record<string, string> = {}): unknown {
  return { method: "POST", headers, body: {} };
}

function createRes(): MockRes {
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.ended = true;
    },
    end() {
      this.ended = true;
    },
    setHeader() {},
  };
}

const ORIGINAL_ENV = { ...process.env };

describe("/api/cron/qualified-leads-digest", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    process.env.NEXTAUTH_SECRET = "secret";
    process.env.RESEND_API_KEY = "rk";
    process.env.RESEND_FROM_EMAIL = "noreply@example.com";
    process.env.OWNER_EMAIL = "josh@example.com";
    process.env.CRON_SECRET = "topsecret";
    jest.clearAllMocks();
    (sendEmail as jest.Mock).mockResolvedValue(true);
    (prisma.chatSession.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (prisma.chatSession.updateMany as jest.Mock) = jest.fn().mockResolvedValue({ count: 0 });
  });
  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 503 when funnel config missing", async () => {
    delete process.env.RESEND_API_KEY;
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(503);
  });

  it("returns 401 without auth", async () => {
    const req = createReq();
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 with wrong bearer", async () => {
    const req = createReq({ authorization: "Bearer wrong" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 with an equal-length wrong bearer (timing-safe branch)", async () => {
    // Same length as "Bearer topsecret" so the compare reaches timingSafeEqual.
    const req = createReq({ authorization: "Bearer topsecreX" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with sent: 0 when no qualified sessions", async () => {
    const req = createReq({ authorization: "Bearer topsecret" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends email and marks sessions when qualified rows exist", async () => {
    (prisma.chatSession.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sess-1",
        sessionId: "abc",
        qualified: true,
        topIntent: "evaluating",
        capturedEmail: "lead@acme.com",
        capturedName: "Sarah",
        langfuseTraceIds: ["t1"],
        createdAt: new Date(),
        messages: [
          { role: "user", content: "hi", intent: "evaluating", createdAt: new Date() },
          { role: "assistant", content: "hello", createdAt: new Date() },
        ],
      },
    ]);

    const req = createReq({ authorization: "Bearer topsecret" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: 1 });
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.chatSession.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["sess-1"] } },
      data: { emailedToOwner: true },
    });
  });

  it("returns 502 and does NOT mark sessions when sendEmail fails", async () => {
    (prisma.chatSession.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sess-1",
        sessionId: "abc",
        qualified: true,
        topIntent: "evaluating",
        capturedEmail: null,
        capturedName: null,
        langfuseTraceIds: [],
        createdAt: new Date(),
        messages: [],
      },
    ]);
    (sendEmail as jest.Mock).mockResolvedValue(false);

    const req = createReq({ authorization: "Bearer topsecret" });
    const res = createRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(502);
    expect(prisma.chatSession.updateMany).not.toHaveBeenCalled();
  });
});
