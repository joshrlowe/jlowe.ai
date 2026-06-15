import type { Message } from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";

/**
 * The chat request contract. Caps turns + length so a hostile client can't
 * blow up the prompt or the Bedrock bill; the beacon context is what the
 * visitor has explored in the 3D world, used only as a grounding hint.
 */
const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
  context: z
    .object({ collectedBeacons: z.array(z.string().max(64)).max(16) })
    .optional(),
});

export type ChatRequest = z.infer<typeof RequestSchema>;

/** Parse + validate the request body; throws on malformed/oversize input. */
export function parseChatRequest(body: string | undefined): ChatRequest {
  return RequestSchema.parse(JSON.parse(body ?? "{}"));
}

/** Map validated turns into the Bedrock Converse message shape. */
export function buildConverseMessages(
  messages: ChatRequest["messages"],
): Message[] {
  return messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }],
  }));
}

/** A grounding hint appended to the system prompt: what the visitor has seen. */
export function beaconContext(context: ChatRequest["context"]): string {
  const beacons = context?.collectedBeacons;
  if (!beacons?.length) return "";
  return `\n\nThe visitor has already explored these in the 3D world: ${beacons.join(
    ", ",
  )}. You may reference them.`;
}
