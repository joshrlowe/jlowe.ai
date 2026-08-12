/**
 * Tests for lib/rag/embed.ts — Titan v2 embedding caller.
 */

jest.mock("@aws-sdk/client-bedrock-runtime", () => {
  const send = jest.fn();
  class MockBedrockRuntimeClient {
    config: unknown;
    send = send;
    constructor(config: unknown) {
      this.config = config;
    }
  }
  class MockInvokeModelCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    BedrockRuntimeClient: MockBedrockRuntimeClient,
    InvokeModelCommand: MockInvokeModelCommand,
    __send: send,
  };
});

import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { generateQueryEmbedding, EMBEDDING_DIMENSIONS } from "@/lib/rag/embed";

const { __send: sendMock } = jest.requireMock("@aws-sdk/client-bedrock-runtime") as {
  __send: jest.Mock;
};

function encodeBody(payload: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(payload));
}

describe("generateQueryEmbedding", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("sends a Titan request and returns the embedding", async () => {
    const embedding = Array.from({ length: 4 }, (_, i) => i / 10);
    sendMock.mockResolvedValueOnce({ body: encodeBody({ embedding }) });

    await expect(generateQueryEmbedding("hello")).resolves.toEqual(embedding);

    const command = sendMock.mock.calls[0][0] as InstanceType<typeof InvokeModelCommand>;
    const input = command.input as { modelId: string; body: Uint8Array };
    expect(input.modelId).toBe("amazon.titan-embed-text-v2:0");
    const requestBody = JSON.parse(new TextDecoder().decode(input.body));
    expect(requestBody).toEqual({
      inputText: "hello",
      dimensions: EMBEDDING_DIMENSIONS,
      normalize: true,
    });
  });

  it("throws on an empty response body", async () => {
    sendMock.mockResolvedValueOnce({ body: undefined });
    await expect(generateQueryEmbedding("x")).rejects.toThrow(
      "Empty response body from Bedrock Titan Embeddings"
    );
  });

  it("throws when the response has no embedding array", async () => {
    sendMock.mockResolvedValueOnce({ body: encodeBody({ embedding: "nope" }) });
    await expect(generateQueryEmbedding("x")).rejects.toThrow("Invalid embedding in response");
  });

  it("memoizes the client across calls", async () => {
    sendMock.mockResolvedValue({ body: encodeBody({ embedding: [1] }) });
    await generateQueryEmbedding("a");
    await generateQueryEmbedding("b");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
