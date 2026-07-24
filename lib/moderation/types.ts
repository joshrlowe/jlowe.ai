/**
 * Comment moderation — shared types.
 *
 * Phase 4 / 05. See lib/moderation/README.md for thresholds and policy.
 */

/**
 * Per-axis classification of a comment, scored 0..1. Produced by Claude
 * Haiku via tool-use. `summary` is a short human-readable note (≤ 100
 * chars) that lands in the admin review UI and in the ActivityLog.
 */
export interface CommentScores {
  spam: number;
  toxicity: number;
  /** How off-topic the comment is relative to the post's topic + title. */
  offTopic: number;
  /** Risk that the comment leaks personally-identifying information. */
  pii: number;
  summary: string;
}

export type ModerationStatus = "approved" | "held" | "rejected";

export type ModerationDecision =
  | { status: "approved" }
  | { status: "held"; reason: string }
  | { status: "rejected"; reason: string };

/**
 * Tagged kinds so the API layer can fail-open to "held" on any of these
 * without re-classifying the failure mode. The pipeline never auto-rejects
 * or auto-approves on a `ModerationError` — see policy / API wiring.
 */
export type ModerationErrorKind = "timeout" | "bedrock_failure" | "malformed_response";

export class ModerationError extends Error {
  readonly kind: ModerationErrorKind;
  readonly cause?: unknown;
  constructor(kind: ModerationErrorKind, message?: string, cause?: unknown) {
    super(message ?? kind);
    this.name = "ModerationError";
    this.kind = kind;
    this.cause = cause;
  }
}

export interface ScoreCommentInput {
  content: string;
  authorName: string;
  postTitle: string;
  postTopic: string;
}
