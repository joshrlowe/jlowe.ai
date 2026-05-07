/**
 * Structure-aware markdown chunker.
 *
 * Walks `marked.lexer()` tokens, tracks heading hierarchy, keeps code blocks
 * intact, splits long paragraphs at sentence boundaries. Targets 300-500
 * tokens per chunk with a 50-token overlap between adjacent chunks.
 */

import { marked, type Tokens } from "marked";

export interface Chunk {
  content: string;
  headingPath: string[];
  tokenCount: number;
  chunkIndex: number;
}

const MIN_TOKENS = 80;
const TARGET_TOKENS_MAX = 500;
const HARD_MAX_TOKENS = 800;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4;

const estimateTokens = (text: string) =>
  Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));

function takeTail(text: string, tokenBudget: number): string {
  const charBudget = tokenBudget * CHARS_PER_TOKEN;
  if (text.length <= charBudget) return text;
  const tail = text.slice(text.length - charBudget);
  // Snap to the next sentence/paragraph break so the overlap doesn't start mid-word.
  const breakIdx = tail.search(/\.\s+|\n\n/);
  if (breakIdx > 0 && breakIdx < tail.length - 5) {
    return tail.slice(breakIdx + 1).trimStart();
  }
  return tail.trimStart();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface BufferState {
  parts: string[];
  tokens: number;
  path: string[];
}

function flush(
  state: BufferState,
  out: Chunk[],
  carryOverlap: boolean,
): void {
  if (state.tokens < MIN_TOKENS || state.parts.length === 0) {
    state.parts = [];
    state.tokens = 0;
    return;
  }
  const content = state.parts.join("\n\n").trim();
  out.push({
    content,
    headingPath: [...state.path],
    tokenCount: state.tokens,
    chunkIndex: out.length,
  });
  if (carryOverlap) {
    const overlap = takeTail(content, OVERLAP_TOKENS);
    state.parts = overlap ? [overlap] : [];
    state.tokens = overlap ? estimateTokens(overlap) : 0;
  } else {
    state.parts = [];
    state.tokens = 0;
  }
}

export function chunkMarkdown(md: string): Chunk[] {
  if (!md || !md.trim()) return [];
  const tokens = marked.lexer(md);
  const out: Chunk[] = [];
  const headingStack: string[] = [];
  const state: BufferState = { parts: [], tokens: 0, path: [] };

  for (const tok of tokens) {
    if (tok.type === "heading") {
      const heading = tok as Tokens.Heading;
      flush(state, out, false);
      headingStack[heading.depth - 1] = heading.text;
      headingStack.length = heading.depth;
      state.path = [...headingStack];
      continue;
    }

    if (tok.type === "space") continue;

    const raw = (tok as { raw?: string }).raw ?? "";
    if (!raw.trim()) continue;
    const tokTokens = estimateTokens(raw);

    // Code blocks stay intact.
    if (tok.type === "code") {
      if (state.tokens > 0 && state.tokens + tokTokens > HARD_MAX_TOKENS) {
        flush(state, out, true);
      }
      state.parts.push(raw);
      state.tokens += tokTokens;
      if (state.tokens >= TARGET_TOKENS_MAX) {
        flush(state, out, true);
      }
      continue;
    }

    // A single oversize paragraph: sentence-split it.
    if (tokTokens > HARD_MAX_TOKENS) {
      flush(state, out, true);
      const sentences = splitSentences(raw);
      for (const s of sentences) {
        const st = estimateTokens(s);
        if (
          state.tokens >= MIN_TOKENS &&
          state.tokens + st > TARGET_TOKENS_MAX
        ) {
          flush(state, out, true);
        }
        state.parts.push(s);
        state.tokens += st;
      }
      continue;
    }

    // Regular block: flush before crossing the soft target.
    if (state.tokens >= MIN_TOKENS && state.tokens + tokTokens > TARGET_TOKENS_MAX) {
      flush(state, out, true);
    }
    state.parts.push(raw);
    state.tokens += tokTokens;
  }

  flush(state, out, false);
  return out;
}
