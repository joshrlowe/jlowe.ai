import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { scoreTrace } from "@/lib/observability/langfuse";

const MAX_TRACE_ID = 100;
const MAX_COMMENT = 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: "chat-feedback",
  });
  if (!allowed) return;

  let body: { traceId?: unknown; score?: unknown; comment?: unknown };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const { traceId, score, comment } = body;
  if (
    typeof traceId !== "string" ||
    traceId.length === 0 ||
    traceId.length > MAX_TRACE_ID
  ) {
    res.status(400).json({ error: "Invalid traceId" });
    return;
  }
  if (score !== 1 && score !== -1) {
    res.status(400).json({ error: "score must be 1 or -1" });
    return;
  }
  if (
    comment !== undefined &&
    comment !== null &&
    (typeof comment !== "string" || comment.length > MAX_COMMENT)
  ) {
    res.status(400).json({ error: "Invalid comment" });
    return;
  }

  await scoreTrace({
    traceId,
    name: "user_feedback",
    value: score,
    comment: typeof comment === "string" ? comment : undefined,
  });
  res.status(204).end();
}
