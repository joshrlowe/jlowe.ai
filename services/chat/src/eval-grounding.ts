/**
 * Tier-2 grounding checks that run in CI with no AWS credentials.
 *
 * `assertGroundedPrompt` is the tooth: a deliberately de-guardrailed prompt
 * (the fixture in eval-grounding.test.ts) must fail it, or the suite is a
 * rubber stamp.
 */

const REQUIRED_SNIPPETS = [
  "source of truth",
  "do **not** guess",
  "Never invent",
];

export function assertGroundedPrompt(prompt: string): void {
  const missing = REQUIRED_SNIPPETS.filter(
    (snippet) => !prompt.includes(snippet),
  );
  if (missing.length > 0) {
    throw new Error(
      `prompt is not grounded; missing: ${missing.map((s) => JSON.stringify(s)).join(", ")}`,
    );
  }
}

/** Intentionally de-guardrailed. Must fail `assertGroundedPrompt`. */
export const UNGUARDED_PROMPT =
  "You are a helpful assistant. If you don't know something, invent a plausible answer so the visitor leaves happy.";

export function citationIndicesAreDense(indices: number[]): boolean {
  if (indices.length === 0) return true;
  const sorted = [...indices].sort((a, b) => a - b);
  return sorted.every((value, i) => value === i + 1);
}
