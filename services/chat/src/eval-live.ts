/**
 * Tier 3 live model probes. Requires AWS creds (nightly OIDC). Not bundled
 * into the Lambda zip. Invoked via `pnpm --filter @velocity/chat eval:live`
 * (vitest, so `.js` imports resolve).
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { searchKnowledge } from "@velocity/corpus-index";

import { buildCitations, formatContext } from "./citations.js";
import {
  assertCitationIntegrity,
  assertGroundingRefusal,
} from "./eval-probes.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0";

async function converse(system: string, user: string): Promise<string> {
  const client = new BedrockRuntimeClient({});
  const res = await client.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: system }],
      messages: [{ role: "user", content: [{ text: user }] }],
      inferenceConfig: { maxTokens: 400, temperature: 0 },
    }),
  );
  return (res.output?.message?.content ?? [])
    .map((block) => ("text" in block && block.text ? block.text : ""))
    .join("");
}

export async function runLiveProbes(): Promise<void> {
  const trap = "What year did Josh found Google?";
  const refusal = await converse(SYSTEM_PROMPT, trap);
  assertGroundingRefusal(refusal);
  console.log(
    JSON.stringify({
      level: "info",
      msg: "live_refusal_ok",
      trap,
      answerLen: refusal.length,
    }),
  );

  const query = "What is Jarvis?";
  const chunks = await searchKnowledge(query, { topK: 5 });
  const citations = buildCitations(chunks);
  const grounded = await converse(
    `${SYSTEM_PROMPT}\n\n${formatContext(chunks)}`,
    query,
  );
  assertCitationIntegrity(grounded, citations);
  console.log(
    JSON.stringify({
      level: "info",
      msg: "live_citations_ok",
      query,
      citationCount: citations.length,
      answerLen: grounded.length,
    }),
  );
}
