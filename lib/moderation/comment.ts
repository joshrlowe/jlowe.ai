/**
 * scoreComment — core of the comment moderation pipeline.
 *
 *   1. Cache hit? return.
 *   2. Open a Langfuse trace + generation (no-op if not configured).
 *   3. Race a Bedrock tool-use call against a 5s timeout.
 *   4. Validate the returned shape.
 *   5. Cache and return.
 *
 * Any failure throws ModerationError so the caller can fail-open to a
 * "held" decision without conflating outage with classifier output.
 */

import { createHash } from 'node:crypto';
import {
  invokeJsonTool,
  MODERATION_MODEL_ID,
  type JsonToolSpec,
} from '@/lib/bedrock/client';
import { startTrace } from '@/lib/observability/langfuse';
import { TtlCache } from './cache';
import {
  ModerationError,
  type CommentScores,
  type ScoreCommentInput,
} from './types';

export const SCORE_COMMENT_TIMEOUT_MS = 5_000;

const SYSTEM_PROMPT = `You are a content moderator for an AI consultancy's blog comments.
Score every comment on FOUR axes, each in [0.0, 1.0] where 0 means "no signal" and 1 means "definitely true":

  spam      — promotional content, link farms, crypto pumping, repetitive marketing.
  toxicity  — harassment, slurs, threats, severe personal attacks.
  offTopic  — unrelated to the post's title or topic.
  pii       — leaks personally identifying information (SSN, full credit card, home address, government IDs, phone numbers).

Then write a one-sentence summary (≤ 100 characters) describing the comment's posture.

Be calibrated, not punitive. Mild disagreement is not toxicity. Asking a clarifying off-topic question is mild offTopic, not severe. Anonymized examples ("call me at 555-0000") are not PII unless they look like a real number.

Return your judgement by calling the report_scores tool.`;

const REPORT_SCORES_TOOL: JsonToolSpec = {
  name: 'report_scores',
  description:
    'Report calibrated 0..1 scores for a comment across spam, toxicity, off-topic, and PII axes, plus a short summary.',
  input_schema: {
    type: 'object',
    properties: {
      spam: { type: 'number', minimum: 0, maximum: 1 },
      toxicity: { type: 'number', minimum: 0, maximum: 1 },
      offTopic: { type: 'number', minimum: 0, maximum: 1 },
      pii: { type: 'number', minimum: 0, maximum: 1 },
      summary: { type: 'string', maxLength: 100 },
    },
    required: ['spam', 'toxicity', 'offTopic', 'pii', 'summary'],
    additionalProperties: false,
  },
};

const cache = new TtlCache<CommentScores>({ capacity: 50, ttlMs: 5 * 60 * 1000 });

function cacheKey(input: ScoreCommentInput): string {
  return createHash('sha256')
    .update(`${input.content}::${input.postTopic}`)
    .digest('hex');
}

function userMessageFor(input: ScoreCommentInput): string {
  return [
    `POST TITLE: ${input.postTitle}`,
    `POST TOPIC: ${input.postTopic}`,
    `AUTHOR NAME: ${input.authorName}`,
    `COMMENT:`,
    input.content,
  ].join('\n');
}

function isNumberInUnit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateScores(raw: unknown): CommentScores {
  if (!raw || typeof raw !== 'object') {
    throw new ModerationError('malformed_response', 'tool input was not an object');
  }
  const r = raw as Record<string, unknown>;
  if (
    !isNumberInUnit(r.spam) ||
    !isNumberInUnit(r.toxicity) ||
    !isNumberInUnit(r.offTopic) ||
    !isNumberInUnit(r.pii) ||
    typeof r.summary !== 'string'
  ) {
    throw new ModerationError(
      'malformed_response',
      `tool input failed schema check: ${JSON.stringify(raw).slice(0, 200)}`,
    );
  }
  return {
    spam: r.spam,
    toxicity: r.toxicity,
    offTopic: r.offTopic,
    pii: r.pii,
    summary: r.summary.slice(0, 100),
  };
}

/**
 * Classify a comment. Throws ModerationError on timeout / Bedrock failure /
 * malformed model output. Cache hits never throw.
 *
 * Test seam: pass `deps.invoke` to mock the Bedrock call without touching
 * the AWS SDK.
 */
export async function scoreComment(
  input: ScoreCommentInput,
  deps: {
    invoke?: typeof invokeJsonTool;
    timeoutMs?: number;
  } = {},
): Promise<CommentScores> {
  const invoke = deps.invoke ?? invokeJsonTool;
  const timeoutMs = deps.timeoutMs ?? SCORE_COMMENT_TIMEOUT_MS;

  const key = cacheKey(input);
  const hit = cache.get(key);
  if (hit) return hit;

  const trace = await startTrace({
    name: 'comment_moderation',
    metadata: {
      postTopic: input.postTopic,
      postTitle: input.postTitle,
      contentLength: input.content.length,
    },
  });
  const generation = trace.generation({
    name: 'claude-haiku-4-5',
    model: MODERATION_MODEL_ID,
    input: userMessageFor(input),
    modelParameters: { temperature: 0, maxTokens: 512 },
  });

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new ModerationError('timeout', `scoreComment exceeded ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    const result = await Promise.race([
      invoke<unknown>({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: userMessageFor(input),
        tool: REPORT_SCORES_TOOL,
      }),
      timeout,
    ]);

    const scores = validateScores(result.input);

    generation.recordUsage({
      input: result.usage.inputTokens,
      output: result.usage.outputTokens,
    });
    generation.end(JSON.stringify(scores));
    trace.end({ status: 'ok', metadata: { decision: 'pending' } });
    void trace.flush();

    cache.set(key, scores);
    return scores;
  } catch (err) {
    const moderationErr =
      err instanceof ModerationError
        ? err
        : new ModerationError('bedrock_failure', (err as Error).message, err);
    generation.fail(moderationErr);
    trace.end({ status: 'error', metadata: { kind: moderationErr.kind } });
    void trace.flush();
    throw moderationErr;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

/** Test-only: clear the in-process cache between runs. */
export function _clearScoreCache(): void {
  cache.clear();
}
