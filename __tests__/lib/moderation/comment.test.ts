/**
 * Tests for lib/moderation/comment.ts
 *
 * The Bedrock call is replaced via the `deps.invoke` test seam, which
 * lets us drive the success / malformed / timeout paths deterministically
 * without touching AWS or the prompt cache.
 */

import {
  scoreComment,
  SCORE_COMMENT_TIMEOUT_MS,
  _clearScoreCache,
} from "../../../lib/moderation/comment";
import { ModerationError } from "../../../lib/moderation/types";

const baseInput = {
  content: "lorem ipsum",
  authorName: "Alice",
  postTitle: "Post Title",
  postTopic: "ai",
};

const validToolResult = (input: Record<string, unknown>) => ({
  input,
  usage: { inputTokens: 10, outputTokens: 5 },
  modelId: "anthropic.claude-haiku-4-5-20251001-v1:0",
});

describe("scoreComment", () => {
  beforeEach(() => {
    _clearScoreCache();
  });

  it("returns parsed scores on a happy-path response", async () => {
    const invoke = jest.fn().mockResolvedValue(
      validToolResult({
        spam: 0.1,
        toxicity: 0.2,
        offTopic: 0.3,
        pii: 0.0,
        summary: "Looks fine.",
      }),
    );

    const scores = await scoreComment(baseInput, { invoke });

    expect(scores).toEqual({
      spam: 0.1,
      toxicity: 0.2,
      offTopic: 0.3,
      pii: 0.0,
      summary: "Looks fine.",
    });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("throws ModerationError('malformed_response') when scores are out of range", async () => {
    const invoke = jest.fn().mockResolvedValue(
      validToolResult({
        spam: 1.5, // out of [0, 1]
        toxicity: 0,
        offTopic: 0,
        pii: 0,
        summary: "x",
      }),
    );

    await expect(scoreComment(baseInput, { invoke })).rejects.toMatchObject({
      name: "ModerationError",
      kind: "malformed_response",
    });
  });

  it("throws ModerationError('malformed_response') when the response shape is wrong", async () => {
    const invoke = jest.fn().mockResolvedValue(
      validToolResult({ random: "garbage" }),
    );

    await expect(scoreComment(baseInput, { invoke })).rejects.toMatchObject({
      kind: "malformed_response",
    });
  });

  it("wraps non-ModerationError exceptions as bedrock_failure", async () => {
    const invoke = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(scoreComment(baseInput, { invoke })).rejects.toMatchObject({
      kind: "bedrock_failure",
    });
  });

  it("throws ModerationError('timeout') when the invoke promise hangs past the deadline", async () => {
    jest.useFakeTimers();
    const invoke = jest.fn(
      () => new Promise(() => undefined), // never resolves
    );

    const promise = scoreComment(baseInput, { invoke, timeoutMs: 50 });
    // Attach the rejection assertion before advancing timers so we don't
    // produce an unhandled-rejection warning if the promise settles early.
    const assertion = expect(promise).rejects.toMatchObject({
      kind: "timeout",
    });

    // advanceTimersByTimeAsync flushes microtasks alongside the timer
    // tick, so the startTrace promise resolves and the internal
    // setTimeout is registered before we tick past it.
    await jest.advanceTimersByTimeAsync(60);
    await assertion;
    jest.useRealTimers();
  });

  it("uses the cache to short-circuit identical inputs within the TTL", async () => {
    const invoke = jest.fn().mockResolvedValue(
      validToolResult({
        spam: 0,
        toxicity: 0,
        offTopic: 0,
        pii: 0,
        summary: "ok",
      }),
    );

    await scoreComment(baseInput, { invoke });
    await scoreComment(baseInput, { invoke });

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("does NOT cross-cache different post topics", async () => {
    const invoke = jest.fn().mockResolvedValue(
      validToolResult({
        spam: 0,
        toxicity: 0,
        offTopic: 0,
        pii: 0,
        summary: "ok",
      }),
    );

    await scoreComment(baseInput, { invoke });
    await scoreComment({ ...baseInput, postTopic: "different" }, { invoke });

    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("uses a 5-second default timeout", () => {
    expect(SCORE_COMMENT_TIMEOUT_MS).toBe(5_000);
  });
});
