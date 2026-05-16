/**
 * Comment moderation policy — pure function over CommentScores.
 *
 * Thresholds are starting points. They will be tuned once we've collected
 * a few hundred real samples in the `moderationScores` column. See
 * lib/moderation/README.md for the rationale and the tuning playbook.
 */

import type { CommentScores, ModerationDecision } from './types';

export const REJECT_THRESHOLD = 0.8; // any single severe-axis score
export const HOLD_THRESHOLD = 0.4; // any single moderate-severity score
export const OFFTOPIC_HOLD_THRESHOLD = 0.7; // off-topic alone is softer

interface AxisHit {
  axis: 'spam' | 'toxicity' | 'pii' | 'offTopic';
  score: number;
}

function fmt(hit: AxisHit): string {
  return `${hit.axis}=${hit.score.toFixed(2)}`;
}

export function decide(scores: CommentScores): ModerationDecision {
  const allAxes: AxisHit[] = [
    { axis: 'spam', score: scores.spam },
    { axis: 'toxicity', score: scores.toxicity },
    { axis: 'pii', score: scores.pii },
  ];

  // Reject: any of spam, toxicity, pii at or above the severe band.
  const rejectHits = allAxes.filter((h) => h.score >= REJECT_THRESHOLD);
  if (rejectHits.length > 0) {
    return { status: 'rejected', reason: rejectHits.map(fmt).join(', ') };
  }

  // Hold: any of spam, toxicity, pii at moderate band, OR off-topic high.
  const holdHits: AxisHit[] = allAxes.filter((h) => h.score >= HOLD_THRESHOLD);
  if (scores.offTopic >= OFFTOPIC_HOLD_THRESHOLD) {
    holdHits.push({ axis: 'offTopic', score: scores.offTopic });
  }
  if (holdHits.length > 0) {
    return { status: 'held', reason: holdHits.map(fmt).join(', ') };
  }

  return { status: 'approved' };
}
