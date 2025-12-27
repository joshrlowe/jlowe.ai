/**
 * Tests for SocialShare component
 */
import { render, screen } from "@testing-library/react";
import SocialShare from "../../components/Articles/SocialShare";

describe("SocialShare", () => {
  const defaultProps = {
    url: "https://example.com/article",
    title: "Test Article",
    description: "Test Description",
  };

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    });
  });

  it("should render share buttons", () => {
    render(<SocialShare {...defaultProps} />);

    expect(screen.getByLabelText("Share on Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Share on LinkedIn")).toBeInTheDocument();
    expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Share via Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Copy link")).toBeInTheDocument();
  });

  it("should encode URLs correctly", () => {
    render(<SocialShare {...defaultProps} />);

    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent(defaultProps.url)),
    );
  });

  it("should handle copy link button click", async () => {
    const { userEvent } = require("@testing-library/user-event");
    const user = userEvent.setup();

    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      defaultProps.url,
    );
  });

  it("should handle missing url prop", () => {
    render(<SocialShare title={defaultProps.title} />);

    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink).toHaveAttribute("href", "#");
  });

  it("should open links in new tab", () => {
    render(<SocialShare {...defaultProps} />);

    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink).toHaveAttribute("target", "_blank");
    expect(twitterLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
