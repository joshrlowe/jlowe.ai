/**
 * Tests for components/Chat/ChatPanel.tsx — the SSE stream consumer.
 *
 * fetch is mocked with a hand-rolled Response shape whose body.getReader()
 * yields scripted SSE frames, exactly matching /api/chat's wire format:
 * default events carry {"type":"text","content":...}; named events are
 * `citations` and `meeting_booking`.
 */

import "@testing-library/jest-dom";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatPanel from "@/components/Chat/ChatPanel";

function sseText(content: string): string {
  return `data: ${JSON.stringify({ type: "text", content })}\n\n`;
}

function sseEvent(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function streamResponse(frames: string[], init: { ok?: boolean; status?: number } = {}) {
  const encoder = new TextEncoder();
  const queue = frames.map((f) => encoder.encode(f));
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: { get: (k: string) => (k === "x-trace-id" ? "trace-42" : null) },
    body: {
      getReader() {
        return {
          read: jest.fn(async () => {
            const value = queue.shift();
            return value ? { done: false, value } : { done: true, value: undefined };
          }),
        };
      },
    },
  };
}

function type(text: string) {
  fireEvent.change(screen.getByPlaceholderText("Ask anything…"), { target: { value: text } });
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe("ChatPanel", () => {
  it("renders the empty-state prompt and focuses the input", () => {
    render(<ChatPanel onClose={jest.fn()} />);
    expect(screen.getByText(/ask about josh/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask anything…")).toHaveFocus();
  });

  it("fires onClose from the header button", () => {
    const onClose = jest.fn();
    render(<ChatPanel onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps send disabled for blank input and never posts", () => {
    render(<ChatPanel onClose={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    type("   ");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("streams text deltas into one assistant message with the trace id", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      streamResponse([sseText("Hel"), sseText("lo!")])
    );
    render(<ChatPanel onClose={jest.fn()} />);

    type("hi there");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("Hello!")).toBeInTheDocument());
    expect(screen.getByText("hi there")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ messages: [{ role: "user", content: "hi there" }] }),
      })
    );
    // Feedback buttons prove the traceId from x-trace-id landed on the message.
    expect(screen.getByRole("button", { name: "Helpful" })).toBeInTheDocument();
  });

  it("handles split SSE frames across reads", async () => {
    const frame = sseText("chunky");
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      streamResponse([frame.slice(0, 10), frame.slice(10)])
    );
    render(<ChatPanel onClose={jest.fn()} />);

    type("q");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("chunky")).toBeInTheDocument());
  });

  it("renders citations and the booking card from named events", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      streamResponse([
        sseText("See [1]"),
        sseEvent("meeting_booking", { url: "https://cal.com/x", message: "Book it" }),
        sseEvent("citations", {
          items: [{ index: 1, title: "RAG", url: "/articles/ai/rag", snippet: "s" }],
        }),
      ])
    );
    render(<ChatPanel onClose={jest.fn()} />);

    type("q");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "[1] RAG →" })).toBeInTheDocument()
    );
    expect(screen.getByText("Book it")).toBeInTheDocument();
  });

  it("skips malformed events and keeps streaming", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      streamResponse(["data: {not json}\n\n", "event: noise\n\n", sseText("survived")])
    );
    render(<ChatPanel onClose={jest.fn()} />);

    type("q");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("survived")).toBeInTheDocument());
  });

  it("marks the assistant message errored when the request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429, body: null });
    render(<ChatPanel onClose={jest.fn()} />);

    type("q");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByText("Chat request failed: 429")).toBeInTheDocument()
    );
  });

  it("sends on Enter but not on Shift+Enter", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(streamResponse([sseText("ok")]));
    render(<ChatPanel onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText("Ask anything…");

    type("multi\nline");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("carries prior turns in the conversation payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(streamResponse([sseText("first reply")]));
    render(<ChatPanel onClose={jest.fn()} />);

    type("first");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByText("first reply")).toBeInTheDocument());

    type("second");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const secondBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(secondBody.messages.map((m: { role: string }) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
  });
});
