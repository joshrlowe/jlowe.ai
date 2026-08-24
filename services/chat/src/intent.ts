/**
 * Intent classifier — ported from v1 `lib/chat/intent.ts`.
 *
 * One short Converse call per user message, in parallel with retrieval.
 * Fail-open to `"researching"` on any error or unrecognized label so a
 * classifier outage never flags a visitor as evaluating.
 *
 * Uses the same Haiku 4.5 inference profile as chat (`BEDROCK_MODEL_ID`)
 * rather than v1's `claude-3-haiku-20240307` — that keeps the IAM policy
 * from growing a second foundation-model ARN for a 16-token classify.
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0";

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

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

let client: BedrockRuntimeClient | undefined;

function getClient(): BedrockRuntimeClient {
  return (client ??= new BedrockRuntimeClient({}));
}

export async function classifyIntent(
  message: string,
  history: ConversationTurn[] = [],
): Promise<Intent> {
  try {
    const recentHistory = history.slice(-3);
    const userBlock = recentHistory.length
      ? recentHistory
          .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
          .join("\n") + `\n\nMost recent USER message:\n${message}`
      : message;
    const res = await getClient().send(
      new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: SYSTEM }],
        messages: [{ role: "user", content: [{ text: userBlock }] }],
        inferenceConfig: { maxTokens: 16, temperature: 0 },
      }),
    );
    const text = (res.output?.message?.content ?? [])
      .map((block) => ("text" in block && block.text ? block.text : ""))
      .join("")
      .trim()
      .toLowerCase();
    const intent = INTENTS.find((i) => text === i || text.includes(i));
    return intent ?? "researching";
  } catch (err) {
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

export function parseIntentLabel(raw: string): Intent {
  const text = raw.trim().toLowerCase();
  return INTENTS.find((i) => text === i || text.includes(i)) ?? "researching";
}
