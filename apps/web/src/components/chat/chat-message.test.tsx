import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChatBubble } from "./chat-message";
import type { ChatMessage } from "./stream";

const assistant: ChatMessage = {
  role: "assistant",
  content: "Jarvis is a self-hosted assistant [1].",
  citations: [
    {
      index: 1,
      title: "Jarvis",
      url: "/projects/jarvis/",
      snippet: "self-hosted personal AI",
    },
    {
      index: 2,
      title: "About",
      url: "/about/",
      snippet: "who Josh is",
    },
  ],
};

describe("ChatBubble", () => {
  it("renders numbered citations as links to the exported routes", () => {
    render(<ChatBubble message={assistant} streaming={false} />);

    const sources = screen.getByRole("navigation", { name: "Sources" });
    expect(sources).toBeInTheDocument();

    const jarvis = screen.getByRole("link", { name: "[1] Jarvis" });
    expect(jarvis).toHaveAttribute("href", "/projects/jarvis/");

    const about = screen.getByRole("link", { name: "[2] About" });
    expect(about).toHaveAttribute("href", "/about/");
  });

  it("turns inline [n] markers into keyboard-accessible source links", async () => {
    const user = userEvent.setup();
    render(<ChatBubble message={assistant} streaming={false} />);

    const inline = screen.getByRole("link", { name: "Source 1: Jarvis" });
    expect(inline).toHaveAttribute("href", "/projects/jarvis/");

    await user.tab();
    expect(inline).toHaveFocus();
  });

  it("renders a booking link from the frame URL and does not invent one", () => {
    render(
      <ChatBubble
        message={{
          role: "assistant",
          content: "Happy to talk.",
          meetingBooking: {
            url: "https://cal.com/josh/30min",
            message: "Want to go deeper?",
          },
        }}
        streaming={false}
      />,
    );

    expect(screen.getByText("Want to go deeper?")).toBeInTheDocument();
    const book = screen.getByRole("link", { name: /book a time/i });
    expect(book).toHaveAttribute("href", "https://cal.com/josh/30min");
    expect(book).toHaveAttribute("target", "_blank");
  });

  it("omits the booking card and sources when those frames never arrived", () => {
    render(
      <ChatBubble
        message={{ role: "assistant", content: "Just text." }}
        streaming={false}
      />,
    );
    expect(
      screen.queryByRole("navigation", { name: "Sources" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("complementary", { name: "Book a meeting" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("does not invent a booking URL when the frame's url is empty", () => {
    render(
      <ChatBubble
        message={{
          role: "assistant",
          content: "Hello",
          meetingBooking: { url: "  ", message: "Want to go deeper?" },
        }}
        streaming={false}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
