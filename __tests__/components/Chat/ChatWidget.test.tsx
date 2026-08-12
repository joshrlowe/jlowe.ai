/**
 * Tests for components/Chat/ChatWidget.tsx — the floating chat launcher.
 */

import "@testing-library/jest-dom";

import { render, screen, fireEvent } from "@testing-library/react";
import ChatWidget from "@/components/Chat/ChatWidget";

describe("ChatWidget", () => {
  it("starts closed with only the launcher button", () => {
    render(<ChatWidget />);
    const button = screen.getByRole("button", { name: "Open chat" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the panel on click and closes on the second click", () => {
    render(<ChatWidget />);
    const button = screen.getByRole("button", { name: "Open chat" });

    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: /vulture/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close chat", expanded: true })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close chat", expanded: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the panel's own close control fires onClose", () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Open chat" }));

    // The panel header has its own close button (aria-label "Close chat"
    // without aria-expanded).
    const headerClose = screen
      .getAllByRole("button", { name: "Close chat" })
      .find((b) => !b.hasAttribute("aria-expanded"));
    expect(headerClose).toBeDefined();
    fireEvent.click(headerClose!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
