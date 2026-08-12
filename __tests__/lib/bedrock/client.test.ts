/**
 * Tests for lib/bedrock/client.ts
 *
 * `@aws-sdk/client-bedrock-runtime` is mocked at module level: the singleton
 * BedrockRuntimeClient gets a jest.fn() `send` that we drive with hand-built
 * responses matching the wire shapes the client consumes (Anthropic
 * event-stream chunks for streamChatResponse, a JSON body for invokeJsonTool).
 * No network, no real credentials.
 */

jest.mock("@aws-sdk/client-bedrock-runtime", () => {
  class MockBedrockRuntimeClient {
    config: unknown;
    send = jest.fn();
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
  class MockInvokeModelWithResponseStreamCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    BedrockRuntimeClient: MockBedrockRuntimeClient,
    InvokeModelCommand: MockInvokeModelCommand,
    InvokeModelWithResponseStreamCommand: MockInvokeModelWithResponseStreamCommand,
  };
});

import {
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  bedrockClient,
  streamChatResponse,
  invokeJsonTool,
  MODERATION_MODEL_ID,
  type JsonToolSpec,
  type Message,
  type ToolSpec,
} from "../../../lib/bedrock/client";

const sendMock = bedrockClient.send as unknown as jest.Mock;

const MESSAGES: Message[] = [{ role: "user", content: "hi" }];

const TOOL: JsonToolSpec = {
  name: "score_comment",
  description: "Scores a comment on several axes",
  input_schema: {
    type: "object",
    properties: { spam: { type: "number" } },
    required: ["spam"],
  },
};

/** Wrap an Anthropic streaming event the way Bedrock delivers it. */
function encodeEvent(event: Record<string, unknown>): { chunk: { bytes: Uint8Array } } {
  return { chunk: { bytes: new TextEncoder().encode(JSON.stringify(event)) } };
}

async function* iterate(items: unknown[]): AsyncGenerator<unknown> {
  for (const item of items) {
    yield item;
  }
}

function mockStream(items: unknown[]): void {
  sendMock.mockResolvedValueOnce({ body: iterate(items) });
}

function mockJsonResponse(payload: Record<string, unknown>): void {
  sendMock.mockResolvedValueOnce({ body: new TextEncoder().encode(JSON.stringify(payload)) });
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of gen) {
    chunks.push(chunk);
  }
  return chunks;
}

function sentCommand(): {
  input: { modelId?: string; contentType?: string; accept?: string; body?: Uint8Array };
} {
  return sendMock.mock.calls[0][0] as {
    input: { modelId?: string; contentType?: string; accept?: string; body?: Uint8Array };
  };
}

function sentBody(): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(sentCommand().input.body)) as Record<string, unknown>;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  sendMock.mockReset();
  process.env.AWS_ACCESS_KEY_ID = "test-access-key-id";
  process.env.AWS_SECRET_ACCESS_KEY = "test-secret-access-key";
  process.env.AWS_REGION = "us-east-1";
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("streamChatResponse", () => {
  it("yields text deltas, fires onFirstToken once, and reports usage per usage event", async () => {
    const onFirstToken = jest.fn();
    const onUsage = jest.fn();
    mockStream([
      encodeEvent({
        type: "message_start",
        message: { usage: { input_tokens: 42, output_tokens: 1 } },
      }),
      encodeEvent({ type: "content_block_start", content_block: { type: "text" } }),
      encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "Hel" } }),
      encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "lo" } }),
      encodeEvent({ type: "ping" }), // unknown event type: ignored
      { chunk: {} }, // chunk member without bytes: skipped
      { unknown_member: true }, // not part of the event union: skipped
      // The AWS event-stream union pads unset members with undefined values.
      {
        chunk: undefined,
        modelStreamErrorException: undefined,
        throttlingException: undefined,
        validationException: undefined,
      },
      encodeEvent({ type: "message_delta", usage: { output_tokens: 7 } }),
    ]);

    const chunks = await collect(
      streamChatResponse({ messages: MESSAGES, systemPrompt: "sys", onFirstToken, onUsage })
    );

    expect(chunks).toEqual(["Hel", "lo"]);
    expect(onFirstToken).toHaveBeenCalledTimes(1);
    expect(onUsage.mock.calls).toEqual([
      [{ inputTokens: 42, outputTokens: 1 }],
      [{ outputTokens: 7 }],
    ]);
  });

  it("sends the expected command and request body with defaults, omitting empty tools", async () => {
    mockStream([]);
    await collect(
      streamChatResponse({
        messages: [
          { role: "user", content: "hello" },
          { role: "assistant", content: "hi there" },
        ],
        systemPrompt: "be nice",
        tools: [],
      })
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sentCommand();
    expect(command).toBeInstanceOf(InvokeModelWithResponseStreamCommand);
    expect(command.input.modelId).toBe("anthropic.claude-3-5-sonnet-20241022-v2:0");
    expect(command.input.contentType).toBe("application/json");
    expect(command.input.accept).toBe("application/json");
    const body = sentBody();
    expect(body).toEqual({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 500,
      temperature: 0.7,
      system: "be nice",
      messages: [
        { role: "user", content: [{ type: "text", text: "hello" }] },
        { role: "assistant", content: [{ type: "text", text: "hi there" }] },
      ],
    });
    expect(body).not.toHaveProperty("tools");
  });

  it("passes custom maxTokens/temperature and non-empty tools through to the request body", async () => {
    const tools: ToolSpec[] = [
      {
        name: "book_meeting",
        description: "Book a meeting",
        input_schema: { type: "object", properties: { topic: { type: "string" } } },
      },
    ];
    mockStream([]);
    await collect(
      streamChatResponse({
        messages: MESSAGES,
        systemPrompt: "s",
        maxTokens: 42,
        temperature: 0.1,
        tools,
      })
    );

    const body = sentBody();
    expect(body.max_tokens).toBe(42);
    expect(body.temperature).toBe(0.1);
    expect(body.tools).toEqual(tools);
  });

  it("assembles a tool_use block across input_json_delta events and fires onToolUse", async () => {
    const onToolUse = jest.fn();
    mockStream([
      encodeEvent({
        type: "content_block_start",
        content_block: { type: "tool_use", name: "book_meeting" },
      }),
      encodeEvent({
        type: "content_block_delta",
        delta: { type: "input_json_delta", partial_json: '{"topic":"ai' },
      }),
      encodeEvent({
        type: "content_block_delta",
        delta: { type: "input_json_delta", partial_json: '","when":"now"}' },
      }),
      encodeEvent({ type: "content_block_stop" }),
      encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "Booked!" } }),
    ]);

    const chunks = await collect(
      streamChatResponse({ messages: MESSAGES, systemPrompt: "s", onToolUse })
    );

    expect(onToolUse).toHaveBeenCalledTimes(1);
    expect(onToolUse).toHaveBeenCalledWith({
      name: "book_meeting",
      input: { topic: "ai", when: "now" },
    });
    expect(chunks).toEqual(["Booked!"]);
  });

  it("defaults the tool name to 'unknown' and the input to {} when the stream omits them", async () => {
    const onToolUse = jest.fn();
    mockStream([
      encodeEvent({ type: "content_block_start", content_block: { type: "tool_use" } }),
      encodeEvent({ type: "content_block_delta", delta: { type: "input_json_delta" } }),
      encodeEvent({ type: "content_block_stop" }),
    ]);

    await collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s", onToolUse }));

    expect(onToolUse).toHaveBeenCalledWith({ name: "unknown", input: {} });
  });

  it("warns and skips onToolUse on malformed tool JSON without killing the stream", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const onToolUse = jest.fn();
    mockStream([
      encodeEvent({ type: "content_block_start", content_block: { type: "tool_use", name: "x" } }),
      encodeEvent({
        type: "content_block_delta",
        delta: { type: "input_json_delta", partial_json: "{not json" },
      }),
      encodeEvent({ type: "content_block_stop" }),
      encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "after" } }),
    ]);

    const chunks = await collect(
      streamChatResponse({ messages: MESSAGES, systemPrompt: "s", onToolUse })
    );

    expect(onToolUse).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "[bedrock] tool input JSON parse failed:",
      expect.any(String)
    );
    expect(chunks).toEqual(["after"]);
  });

  it("ignores tool events arriving with no open tool block", async () => {
    const onToolUse = jest.fn();
    mockStream([
      encodeEvent({
        type: "content_block_delta",
        delta: { type: "input_json_delta", partial_json: "{}" },
      }),
      encodeEvent({ type: "content_block_stop" }),
      encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "ok" } }),
    ]);

    const chunks = await collect(
      streamChatResponse({ messages: MESSAGES, systemPrompt: "s", onToolUse })
    );

    expect(onToolUse).not.toHaveBeenCalled();
    expect(chunks).toEqual(["ok"]);
  });

  it("runs without any optional callbacks", async () => {
    mockStream([
      encodeEvent({ type: "message_start", message: {} }), // usage absent
      encodeEvent({
        type: "message_start",
        message: { usage: { input_tokens: 1, output_tokens: 0 } },
      }),
      encodeEvent({ type: "content_block_start", content_block: { type: "tool_use", name: "t" } }),
      encodeEvent({ type: "content_block_stop" }),
      encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "ok" } }),
      encodeEvent({ type: "message_delta" }), // usage absent
      encodeEvent({ type: "message_delta", usage: { output_tokens: 2 } }),
    ]);

    await expect(
      collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
    ).resolves.toEqual(["ok"]);
  });

  it("throws on an empty response body", async () => {
    sendMock.mockResolvedValueOnce({ body: undefined });
    await expect(
      collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
    ).rejects.toThrow("Empty response body from Bedrock");
  });

  it("propagates a SyntaxError when a chunk contains malformed JSON", async () => {
    mockStream([{ chunk: { bytes: new TextEncoder().encode("not json") } }]);
    await expect(
      collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
    ).rejects.toThrow(SyntaxError);
  });

  describe("in-stream exception members", () => {
    /** Assert the stream yields prior text, then rejects on the poison item. */
    async function expectStreamError(
      item: Record<string, unknown>,
      message: string
    ): Promise<void> {
      mockStream([
        encodeEvent({ type: "content_block_delta", delta: { type: "text_delta", text: "part" } }),
        item,
      ]);
      const gen = streamChatResponse({ messages: MESSAGES, systemPrompt: "s" });
      await expect(gen.next()).resolves.toEqual({ done: false, value: "part" });
      await expect(gen.next()).rejects.toThrow(message);
    }

    it("throws on modelStreamErrorException after yielding earlier text", async () => {
      await expectStreamError(
        { modelStreamErrorException: { message: "boom" } },
        "Bedrock stream error: boom"
      );
    });

    it("falls back to a generic modelStreamErrorException message", async () => {
      await expectStreamError(
        { modelStreamErrorException: {} },
        "Bedrock stream error: Unknown error"
      );
    });

    it("warns and throws on throttlingException", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      await expectStreamError(
        { throttlingException: { message: "slow down" } },
        "Bedrock throttled: slow down"
      );
      expect(warnSpy).toHaveBeenCalledWith("Bedrock throttled during stream:", "slow down");
    });

    it("falls back to a generic throttlingException message", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});
      await expectStreamError({ throttlingException: {} }, "Bedrock throttled: Retry later");
    });

    it("throws on validationException", async () => {
      await expectStreamError(
        { validationException: { message: "bad payload" } },
        "Bedrock validation error: bad payload"
      );
    });

    it("falls back to a generic validationException message", async () => {
      await expectStreamError({ validationException: {} }, "Bedrock validation error: Invalid request");
    });
  });

  describe("send() rejection mapping", () => {
    it("maps AccessDeniedException to an actionable error", async () => {
      sendMock.mockRejectedValueOnce(
        Object.assign(new Error("denied"), { name: "AccessDeniedException" })
      );
      await expect(
        collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
      ).rejects.toThrow(
        "Access denied to Bedrock. Verify IAM permissions for bedrock:InvokeModelWithResponseStream."
      );
    });

    it("warns and rethrows the original ThrottlingException", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const original = Object.assign(new Error("throttled"), { name: "ThrottlingException" });
      sendMock.mockRejectedValueOnce(original);
      await expect(
        collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
      ).rejects.toBe(original);
      expect(warnSpy).toHaveBeenCalledWith("Bedrock throttled, retry later");
    });

    it("maps ModelStreamErrorException, preserving its message", async () => {
      sendMock.mockRejectedValueOnce(
        Object.assign(new Error("cut off"), { name: "ModelStreamErrorException" })
      );
      await expect(
        collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
      ).rejects.toThrow("Bedrock stream interrupted: cut off");
    });

    it("maps a message-less ModelStreamErrorException to a generic message", async () => {
      sendMock.mockRejectedValueOnce(
        Object.assign(new Error(""), { name: "ModelStreamErrorException" })
      );
      await expect(
        collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
      ).rejects.toThrow("Bedrock stream interrupted: Unknown error");
    });

    it("rethrows unrecognized errors untouched", async () => {
      const original = new Error("kaboom");
      sendMock.mockRejectedValueOnce(original);
      await expect(
        collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
      ).rejects.toBe(original);
    });
  });

  it.each(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"] as const)(
    "throws before calling Bedrock when %s is missing",
    async (envKey) => {
      delete process.env[envKey];
      await expect(
        collect(streamChatResponse({ messages: MESSAGES, systemPrompt: "s" }))
      ).rejects.toThrow(
        "AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION."
      );
      expect(sendMock).not.toHaveBeenCalled();
    }
  );
});

describe("invokeJsonTool", () => {
  it("returns the typed tool input, usage, and default model id on the happy path", async () => {
    mockJsonResponse({
      content: [
        { type: "text", text: "thinking out loud" },
        { type: "tool_use", name: "score_comment", input: { spam: 0.1 } },
      ],
      usage: { input_tokens: 12, output_tokens: 3 },
      stop_reason: "tool_use",
    });

    const result = await invokeJsonTool<{ spam: number }>({
      systemPrompt: "sys",
      userMessage: "score this",
      tool: TOOL,
    });

    expect(result).toEqual({
      input: { spam: 0.1 },
      usage: { inputTokens: 12, outputTokens: 3 },
      modelId: MODERATION_MODEL_ID,
    });

    const command = sentCommand();
    expect(command).toBeInstanceOf(InvokeModelCommand);
    expect(command.input.modelId).toBe(MODERATION_MODEL_ID);
    expect(command.input.contentType).toBe("application/json");
    expect(command.input.accept).toBe("application/json");
    const body = sentBody();
    expect(body).toEqual({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 512,
      temperature: 0,
      system: "sys",
      messages: [{ role: "user", content: [{ type: "text", text: "score this" }] }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: "score_comment" },
    });
  });

  it("honors modelId, maxTokens, temperature, and abortSignal overrides", async () => {
    const controller = new AbortController();
    mockJsonResponse({ content: [{ type: "tool_use", name: "score_comment", input: {} }] });

    const result = await invokeJsonTool({
      modelId: "custom.model-v1:0",
      systemPrompt: "s",
      userMessage: "u",
      tool: TOOL,
      maxTokens: 64,
      temperature: 0.5,
      abortSignal: controller.signal,
    });

    expect(result.modelId).toBe("custom.model-v1:0");
    expect(result.input).toEqual({});
    expect(result.usage.inputTokens).toBeUndefined();
    expect(result.usage.outputTokens).toBeUndefined();
    expect(sentCommand().input.modelId).toBe("custom.model-v1:0");
    const body = sentBody();
    expect(body.max_tokens).toBe(64);
    expect(body.temperature).toBe(0.5);
    const options = sendMock.mock.calls[0][1] as { abortSignal?: AbortSignal };
    expect(options.abortSignal).toBe(controller.signal);
  });

  it("maps AccessDeniedException to an actionable error naming the model", async () => {
    sendMock.mockRejectedValueOnce(
      Object.assign(new Error("denied"), { name: "AccessDeniedException" })
    );
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      `Access denied to Bedrock model ${MODERATION_MODEL_ID}. Verify IAM permissions for bedrock:InvokeModel and that the model is enabled in the region.`
    );
  });

  it("rethrows other send() failures untouched", async () => {
    const original = Object.assign(new Error("throttled"), { name: "ThrottlingException" });
    sendMock.mockRejectedValueOnce(original);
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toBe(
      original
    );
  });

  it("throws on an empty response body", async () => {
    sendMock.mockResolvedValueOnce({ body: undefined });
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      "Empty response body from Bedrock"
    );
  });

  it("propagates a SyntaxError when the response body is not JSON", async () => {
    sendMock.mockResolvedValueOnce({ body: new TextEncoder().encode("{oops") });
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      SyntaxError
    );
  });

  it("throws with the stop_reason when the model returns no tool call", async () => {
    mockJsonResponse({ content: [{ type: "text", text: "sorry" }], stop_reason: "end_turn" });
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      "Bedrock did not return a score_comment tool call (stop_reason=end_turn)"
    );
  });

  it("does not match a tool_use block carrying a different tool name", async () => {
    mockJsonResponse({
      content: [{ type: "tool_use", name: "other_tool", input: {} }],
      stop_reason: "tool_use",
    });
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      "Bedrock did not return a score_comment tool call (stop_reason=tool_use)"
    );
  });

  it("reports stop_reason=unknown when the response has no content or stop_reason", async () => {
    mockJsonResponse({});
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      "Bedrock did not return a score_comment tool call (stop_reason=unknown)"
    );
  });

  it("throws before calling Bedrock when credentials are missing", async () => {
    delete process.env.AWS_SECRET_ACCESS_KEY;
    await expect(invokeJsonTool({ systemPrompt: "s", userMessage: "u", tool: TOOL })).rejects.toThrow(
      "AWS credentials not configured"
    );
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("bedrockClient construction", () => {
  it("defaults the region to us-east-1 when AWS_REGION is unset at module load", async () => {
    delete process.env.AWS_REGION;
    let fresh!: typeof import("../../../lib/bedrock/client");
    await jest.isolateModulesAsync(async () => {
      fresh = await import("../../../lib/bedrock/client");
    });
    expect(
      (fresh.bedrockClient as unknown as { config: { region: string } }).config.region
    ).toBe("us-east-1");
  });

  it("uses AWS_REGION when it is set at module load", async () => {
    process.env.AWS_REGION = "eu-west-2";
    let fresh!: typeof import("../../../lib/bedrock/client");
    await jest.isolateModulesAsync(async () => {
      fresh = await import("../../../lib/bedrock/client");
    });
    expect(
      (fresh.bedrockClient as unknown as { config: { region: string } }).config.region
    ).toBe("eu-west-2");
  });
});
