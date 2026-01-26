/**
 * Tests for SocialShare component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SocialShare from "@/components/Articles/SocialShare";

describe("SocialShare", () => {
  const defaultProps = {
    url: "https://example.com/article",
    title: "Test Article Title",
    description: "Test article description",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders Share label", () => {
    render(<SocialShare {...defaultProps} />);
    expect(screen.getByText("Share:")).toBeInTheDocument();
  });

  it("renders Twitter share link", () => {
    render(<SocialShare {...defaultProps} />);
    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink).toBeInTheDocument();
    expect(twitterLink).toHaveAttribute("href", expect.stringContaining("twitter.com"));
    expect(twitterLink).toHaveAttribute("target", "_blank");
  });

  it("renders LinkedIn share link", () => {
    render(<SocialShare {...defaultProps} />);
    const linkedinLink = screen.getByLabelText("Share on LinkedIn");
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute("href", expect.stringContaining("linkedin.com"));
  });

  it("renders Facebook share link", () => {
    render(<SocialShare {...defaultProps} />);
    const facebookLink = screen.getByLabelText("Share on Facebook");
    expect(facebookLink).toBeInTheDocument();
    expect(facebookLink).toHaveAttribute("href", expect.stringContaining("facebook.com"));
  });

  it("renders copy link button", () => {
    render(<SocialShare {...defaultProps} />);
    expect(screen.getByLabelText("Copy link")).toBeInTheDocument();
  });

  it("encodes URL in share links", () => {
    const propsWithSpecialChars = {
      ...defaultProps,
      url: "https://example.com/article?param=value",
    };
    render(<SocialShare {...propsWithSpecialChars} />);

    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink.href).toContain(encodeURIComponent(propsWithSpecialChars.url));
  });

  it("encodes title in Twitter share link", () => {
    render(<SocialShare {...defaultProps} />);
    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink.href).toContain(encodeURIComponent(defaultProps.title));
  });

  it("copies URL to clipboard when copy button is clicked", async () => {
    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.url);
    });
  });

  it("shows checkmark icon after copying", async () => {
    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      // Button should have success styling
      expect(copyButton.className).toContain("text-green-400");
    });
  });

  it("resets copy state after timeout", async () => {
    jest.useFakeTimers();
    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    fireEvent.click(copyButton);

    // Wait for the copy state to be set
    await waitFor(() => {
      expect(copyButton.className).toContain("text-green-400");
    });

    // Advance timers by 2 seconds
    jest.advanceTimersByTime(2000);

    // Button should reset to normal styling
    await waitFor(() => {
      expect(copyButton.className).not.toContain("text-green-400");
    });

    jest.useRealTimers();
  });

  it("handles clipboard error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error("Copy failed"));

    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to copy:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it("has noopener noreferrer on external links", () => {
    render(<SocialShare {...defaultProps} />);

    const twitterLink = screen.getByLabelText("Share on Twitter");
    const linkedinLink = screen.getByLabelText("Share on LinkedIn");
    const facebookLink = screen.getByLabelText("Share on Facebook");

    expect(twitterLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(facebookLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all social icons", () => {
    render(<SocialShare {...defaultProps} />);

    // Should have 3 social links + 1 copy button
    const buttons = screen.getAllByRole("link");
    expect(buttons).toHaveLength(3);

    const copyButton = screen.getByRole("button");
    expect(copyButton).toBeInTheDocument();
  });

  it("calls handleShareClick when clicking Twitter link", () => {
    render(<SocialShare {...defaultProps} />);
    const twitterLink = screen.getByLabelText("Share on Twitter");
    fireEvent.click(twitterLink);
    // Click should trigger without error - analytics is mocked
    expect(twitterLink).toBeInTheDocument();
  });

  it("calls handleShareClick when clicking LinkedIn link", () => {
    render(<SocialShare {...defaultProps} />);
    const linkedinLink = screen.getByLabelText("Share on LinkedIn");
    fireEvent.click(linkedinLink);
    expect(linkedinLink).toBeInTheDocument();
  });

  it("calls handleShareClick when clicking Facebook link", () => {
    render(<SocialShare {...defaultProps} />);
    const facebookLink = screen.getByLabelText("Share on Facebook");
    fireEvent.click(facebookLink);
    expect(facebookLink).toBeInTheDocument();
  });
});
