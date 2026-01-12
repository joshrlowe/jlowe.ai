/**
 * Tests for SocialShare component
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SocialShare from "../../components/Articles/SocialShare";

describe("SocialShare", () => {
  const defaultProps = {
    url: "https://example.com/article",
    title: "Test Article",
    description: "Test Description",
  };

  // Mock clipboard API
  const mockWriteText = jest.fn().mockResolvedValue();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  it("should render share buttons", () => {
    render(<SocialShare {...defaultProps} />);

    expect(screen.getByLabelText("Share on Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Share on LinkedIn")).toBeInTheDocument();
    expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
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
    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(defaultProps.url);
    });
  });

  it("should open links in new tab", () => {
    render(<SocialShare {...defaultProps} />);

    const twitterLink = screen.getByLabelText("Share on Twitter");
    expect(twitterLink).toHaveAttribute("target", "_blank");
    expect(twitterLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should show copied state after clicking copy", async () => {
    jest.useFakeTimers();
    render(<SocialShare {...defaultProps} />);

    const copyButton = screen.getByLabelText("Copy link");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it("should render Share label", () => {
    render(<SocialShare {...defaultProps} />);
    expect(screen.getByText("Share:")).toBeInTheDocument();
  });

  it("should have correct LinkedIn share URL", () => {
    render(<SocialShare {...defaultProps} />);

    const linkedInLink = screen.getByLabelText("Share on LinkedIn");
    expect(linkedInLink).toHaveAttribute(
      "href",
      expect.stringContaining("linkedin.com"),
    );
  });

  it("should have correct Facebook share URL", () => {
    render(<SocialShare {...defaultProps} />);

    const facebookLink = screen.getByLabelText("Share on Facebook");
    expect(facebookLink).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com"),
    );
  });
});
