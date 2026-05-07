import { highestPriorityIntent } from "@/lib/chat/intent";

const sendMock = jest.fn();
jest.mock("@aws-sdk/client-bedrock-runtime", () => {
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    InvokeModelCommand: jest.fn().mockImplementation((p) => ({ __cmd: p })),
  };
});

import { classifyIntent } from "@/lib/chat/intent";

function bodyFor(text: string): { body: Uint8Array } {
  return {
    body: new TextEncoder().encode(JSON.stringify({ content: [{ text }] })),
  };
}

describe("classifyIntent", () => {
  beforeEach(() => {
    sendMock.mockReset();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("returns researching for an exploratory ask", async () => {
    sendMock.mockResolvedValue(bodyFor("researching"));
    const intent = await classifyIntent("How does RAG work?", []);
    expect(intent).toBe("researching");
  });

  it("returns evaluating for a project description", async () => {
    sendMock.mockResolvedValue(bodyFor("evaluating"));
    const intent = await classifyIntent(
      "I'm building a customer support bot for my SaaS, do you do consulting?",
      [],
    );
    expect(intent).toBe("evaluating");
  });

  it("returns technical_question for a doc-style ask", async () => {
    sendMock.mockResolvedValue(bodyFor("technical_question"));
    const intent = await classifyIntent("What's HNSW?", []);
    expect(intent).toBe("technical_question");
  });

  it("returns unrelated for off-topic", async () => {
    sendMock.mockResolvedValue(bodyFor("unrelated"));
    const intent = await classifyIntent("test test 123", []);
    expect(intent).toBe("unrelated");
  });

  it("falls open to researching when SDK throws", async () => {
    sendMock.mockRejectedValue(new Error("network down"));
    const intent = await classifyIntent("anything", []);
    expect(intent).toBe("researching");
  });

  it("falls open when model returns garbage", async () => {
    sendMock.mockResolvedValue(bodyFor("???"));
    const intent = await classifyIntent("anything", []);
    expect(intent).toBe("researching");
  });
});

describe("highestPriorityIntent", () => {
  it("evaluating dominates anything else", () => {
    expect(highestPriorityIntent("researching", "evaluating")).toBe("evaluating");
    expect(highestPriorityIntent("evaluating", "researching")).toBe("evaluating");
    expect(highestPriorityIntent(null, "evaluating")).toBe("evaluating");
  });
  it("technical_question beats researching", () => {
    expect(highestPriorityIntent("researching", "technical_question")).toBe("technical_question");
    expect(highestPriorityIntent("technical_question", "researching")).toBe("technical_question");
  });
  it("unrelated never wins over anything", () => {
    expect(highestPriorityIntent("researching", "unrelated")).toBe("researching");
    expect(highestPriorityIntent(null, "unrelated")).toBe("unrelated");
  });
  it("invalid prev defaults to researching", () => {
    expect(highestPriorityIntent("garbage", "technical_question")).toBe("technical_question");
  });
});
