/**
 * Tool spec for the booking flow + Cal.com URL builder.
 */

import type { ToolSpec } from "@/lib/bedrock/client";
import { getConfig } from "@/lib/config";

export const bookMeetingTool: ToolSpec = {
  name: "book_meeting",
  description:
    "Offer the visitor a 30-minute call with Josh to discuss their project. " +
    "Call this tool ONLY when the visitor has described a real project they want help with " +
    "or has asked about availability/pricing/process. " +
    "Before calling this tool, briefly tell the visitor what you'd love to discuss in the call. " +
    "Extract the visitor's name and email if they have shared them in the conversation.",
  input_schema: {
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
};

export interface CalcomUrlInput {
  name?: string;
  email?: string;
  topicSummary: string;
}

/**
 * Builds a prefilled Cal.com booking URL. Returns null if Cal.com is not
 * configured (`CALCOM_USERNAME` env var missing).
 */
export function getCalcomBookingUrl(input: CalcomUrlInput): string | null {
  const cfg = getConfig().calcom;
  if (!cfg) return null;
  const params = new URLSearchParams();
  if (input.name) params.set("name", input.name);
  if (input.email) params.set("email", input.email);
  params.set("notes", input.topicSummary);
  return `https://cal.com/${cfg.username}/${cfg.eventTypeSlug}?${params.toString()}`;
}
