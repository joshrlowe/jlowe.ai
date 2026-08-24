/**
 * State machine for ConverseStream tool-use input.
 *
 * Tool arguments arrive as **partial JSON across `contentBlockDelta` events**
 * (`delta.toolUse.input` is a string fragment). We assemble, then parse on
 * `contentBlockStop`. A malformed buffer fails closed (no tool call) rather
 * than throwing into the chat stream.
 */

export interface ConverseStreamItem {
  contentBlockStart?: {
    start?: { toolUse?: { name?: string } };
  };
  contentBlockDelta?: {
    delta?: { text?: string; toolUse?: { input?: string } };
  };
  contentBlockStop?: unknown;
}

export type AssemblerState =
  | { phase: "idle" }
  | { phase: "tool"; name: string; jsonBuf: string };

export const IDLE: AssemblerState = { phase: "idle" };

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface AssemblerResult {
  state: AssemblerState;
  text?: string;
  toolCall?: ToolCall;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseToolInput(
  jsonBuf: string,
): Record<string, unknown> | null {
  const trimmed = jsonBuf.trim();
  if (trimmed === "") return {};
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function reduceStreamItem(
  state: AssemblerState,
  item: ConverseStreamItem,
): AssemblerResult {
  const toolStart = item.contentBlockStart?.start?.toolUse;
  if (toolStart) {
    return {
      state: { phase: "tool", name: toolStart.name ?? "unknown", jsonBuf: "" },
    };
  }

  const text = item.contentBlockDelta?.delta?.text;
  if (text) {
    return { state, text };
  }

  const fragment = item.contentBlockDelta?.delta?.toolUse?.input;
  if (fragment !== undefined && state.phase === "tool") {
    return {
      state: { ...state, jsonBuf: state.jsonBuf + fragment },
    };
  }

  if ("contentBlockStop" in item && state.phase === "tool") {
    const input = parseToolInput(state.jsonBuf);
    if (input === null) {
      return { state: IDLE };
    }
    return {
      state: IDLE,
      toolCall: { name: state.name, input },
    };
  }

  return { state };
}
