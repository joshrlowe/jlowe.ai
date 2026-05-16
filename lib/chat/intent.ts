/**
 * Intent classifier for chat messages.
 *
 * Single Bedrock Haiku call per user message. Wrapped in a Langfuse span
 * when a trace handle is provided. Returns "researching" on any failure or
 * unrecognized output (fail-open: do not flag visitors as evaluating in error).
 *
 * Runs in parallel with retrieval, so its ~150ms latency is hidden by the
 * slower of the two paths most of the time.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { TraceHandle } from "@/lib/observability/langfuse";

const HAIKU_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export type Intent =
  | "researching"
  | "evaluating"
  | "technical_question"
  | "unrelated";

const INTENTS: Intent[] = [
  "researching",
  "evaluating",
  "technical_question",
  "unrelated",
];

const SYSTEM = `You classify a visitor's most recent message into ONE of these intents:

- researching: Visitor is exploring topics, learning, browsing. No project of their own implied.
- evaluating: Visitor describes a project of theirs, asks about availability/pricing/process, or asks specifically about Josh's experience with their problem.
- technical_question: Specific technical question that could be answered from documentation. No project context.
- unrelated: Off-topic, abuse, or test messages.

Reply with ONLY the intent label. No prose, no punctuation, no explanation.`;

interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

let _client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!_client) {
    _client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }
  return _client;
}

export async function classifyIntent(
  message: string,
  history: ConversationTurn[] = [],
  options: { trace?: TraceHandle } = {},
): Promise<Intent> {
  const span = options.trace?.span("intent_classify", {
    messageLen: message.length,
  });
  try {
    const recentHistory = history.slice(-3);
    const userBlock = recentHistory.length
      ? recentHistory
          .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
          .join("\n") + `\n\nMost recent USER message:\n${message}`
      : message;
    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 16,
      system: SYSTEM,
      messages: [{ role: "user", content: userBlock }],
    });
    const res = await getClient().send(
      new InvokeModelCommand({
        modelId: HAIKU_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: new TextEncoder().encode(body),
      }),
    );
    if (!res.body) throw new Error("Empty response from Haiku");
    const decoded = JSON.parse(new TextDecoder().decode(res.body)) as {
      content?: Array<{ text?: string }>;
    };
    const text = (decoded.content?.[0]?.text ?? "").trim().toLowerCase();
    const intent = INTENTS.find((i) => text === i || text.includes(i));
    span?.end({ intent: intent ?? "researching", raw: text });
    return intent ?? "researching";
  } catch (err) {
    span?.fail(err as Error);
    console.warn("[intent] classify failed:", (err as Error).message);
    return "researching";
  }
}

const PRIORITY: Record<Intent, number> = {
  unrelated: 0,
  researching: 1,
  technical_question: 2,
  evaluating: 3,
};

/**
 * Returns the higher-priority of two intents (ranks the session by its peak).
 * If prev is null/undefined/unrecognized, the new intent wins outright.
 */
export function highestPriorityIntent(
  prev: string | null | undefined,
  current: Intent,
): Intent {
  if (!prev) return current;
  const prevIntent = prev as Intent;
  if (!INTENTS.includes(prevIntent)) return current;
  return PRIORITY[current] >= PRIORITY[prevIntent] ? current : prevIntent;
}
