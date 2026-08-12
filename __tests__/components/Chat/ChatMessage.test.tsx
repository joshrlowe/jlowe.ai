/**
 * Tests for components/Chat/ChatMessage.tsx — message bubbles with inline
 * citations, the booking card, and feedback voting.
 */

import "@testing-library/jest-dom";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import ChatMessageBubble from "@/components/Chat/ChatMessage";
import type { ChatMessage } from "@/components/Chat/types";

const CITATIONS = [
  { index: 1, title: "RAG article", url: "/articles/ai/rag", snippet: "About RAG" },
  { index: 2, title: "Jarvis", url: "/projects/jarvis", snippet: "About Jarvis" },
];

function assistant(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return { role: "assistant", content: "Hello there", traceId: "trace-1", ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as unknown as typeof fetch;
});

describe("rendering", () => {
  it("renders a plain user bubble without feedback controls", () => {
    render(<ChatMessageBubble message={{ role: "user", content: "hi" }} />);
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Helpful" })).not.toBeInTheDocument();
  });

  it("shows a typing ellipsis for an empty assistant message", () => {
    render(<ChatMessageBubble message={assistant({ content: "", traceId: null })} />);
    expect(screen.getByText("…")).toBeInTheDocument();
  });

  it("linkifies [n] markers that match citations and leaves unmatched ones as text", () => {
    render(
      <ChatMessageBubble
        message={assistant({ content: "See [1] and [9].", citations: CITATIONS })}
      />
    );
    const inline = screen.getAllByRole("link", { name: "[1]" });
    expect(inline[0]).toHaveAttribute("href", "/articles/ai/rag");
    expect(screen.getByText(/\[9\]/)).toBeInTheDocument();
  });

  it("renders citation chips with titles", () => {
    render(<ChatMessageBubble message={assistant({ citations: CITATIONS })} />);
    expect(screen.getByRole("link", { name: "[2] Jarvis →" })).toHaveAttribute(
      "href",
      "/projects/jarvis"
    );
  });

  it("renders the meeting booking card", () => {
    render(
      <ChatMessageBubble
        message={assistant({
          meetingBooking: { url: "https://cal.com/josh/30", message: "Grab a slot" },
        })}
      />
    );
    expect(screen.getByText("Grab a slot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book a 30-min call/i })).toHaveAttribute(
      "href",
      "https://cal.com/josh/30"
    );
  });

  it("omits feedback controls without a traceId", () => {
    render(<ChatMessageBubble message={assistant({ traceId: null })} />);
    expect(screen.queryByRole("button", { name: "Helpful" })).not.toBeInTheDocument();
  });
});

describe("feedback voting", () => {
  it("posts a +1 score and thanks the user", async () => {
    render(<ChatMessageBubble message={assistant()} />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Thanks for the feedback"));
    expect(global.fetch).toHaveBeenCalledWith("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId: "trace-1", score: 1 }),
    });
    expect(screen.getByRole("button", { name: "Helpful" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Not helpful" })).toBeDisabled();
  });

  it("posts a -1 score from the thumbs-down button", async () => {
    render(<ChatMessageBubble message={assistant()} />);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toContain('"score":-1');
  });

  it("shows an error toast when the feedback call fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    render(<ChatMessageBubble message={assistant()} />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't send feedback"));
    // A failed vote stays revotable.
    expect(screen.getByRole("button", { name: "Helpful" })).toBeEnabled();
  });

  it("ignores further votes after a successful one", async () => {
    render(<ChatMessageBubble message={assistant()} />);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
