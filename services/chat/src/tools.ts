/**
 * `book_meeting` tool + Cal.com URL builder. Ported from v1 `lib/chat/tools.ts`.
 *
 * Converse wraps the spec one level deeper than the raw Anthropic schema:
 * `toolConfig.tools[].toolSpec` (not `tools[]`). Fail *closed* when Cal.com
 * is not configured — never expose the tool, never invent a booking URL.
 */

import type { Tool } from "@aws-sdk/client-bedrock-runtime";

import type { Intent } from "./intent.js";

export const BOOKING_CTA =
  "Want to chat about this in more depth? Here's a quick way to grab 30 minutes with Josh.";

export const bookMeetingTool: Tool = {
  toolSpec: {
    name: "book_meeting",
    description:
      "Offer the visitor a 30-minute call with Josh to discuss their project. " +
      "Call this tool ONLY when the visitor has described a real project they want help with " +
      "or has asked about availability/pricing/process. " +
      "Before calling this tool, briefly tell the visitor what you'd love to discuss in the call. " +
      "Extract the visitor's name and email if they have shared them in the conversation.",
    inputSchema: {
      json: {
        type: "object",
        properties: {
          topicSummary: {
            type: "string",
            description:
              "1–2 sentence summary of what the visitor wants to discuss. Required.",
          },
          name: {
            type: "string",
            description: "Visitor's name if they shared it. Otherwise omit.",
          },
          email: {
            type: "string",
            description: "Visitor's email if they shared it. Otherwise omit.",
          },
        },
        required: ["topicSummary"],
      },
    },
  },
};

export interface CalcomUrlInput {
  name?: string;
  email?: string;
  topicSummary: string;
}

export function isCalcomConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env.CALCOM_USERNAME);
}

/**
 * Builds a prefilled Cal.com booking URL. Returns null if Cal.com is not
 * configured (`CALCOM_USERNAME` missing) — callers must fail closed.
 */
export function getCalcomBookingUrl(
  input: CalcomUrlInput,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const username = env.CALCOM_USERNAME;
  if (!username) return null;
  const slug = env.CALCOM_EVENT_TYPE_SLUG || "30min";
  const params = new URLSearchParams();
  if (input.name) params.set("name", input.name);
  if (input.email) params.set("email", input.email);
  params.set("notes", input.topicSummary);
  return `https://cal.com/${username}/${slug}?${params.toString()}`;
}

/**
 * Gate copied from v1 chat: tool is offered only after the session has shown
 * evaluating intent (or is already qualified) and only until it has fired once.
 * Cal.com must be configured — otherwise fail closed.
 */
export function shouldExposeBookingTool(args: {
  qualified: boolean;
  bookingOffered: boolean;
  intent: Intent;
  calcomConfigured: boolean;
}): boolean {
  return (
    args.calcomConfigured &&
    (args.qualified || args.intent === "evaluating") &&
    !args.bookingOffered
  );
}
