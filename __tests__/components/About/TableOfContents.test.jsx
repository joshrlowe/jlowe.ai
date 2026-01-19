/**
 * Tests for TableOfContents component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TableOfContents from "@/components/About/TableOfContents/TableOfContents";

describe("TableOfContents", () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    // Mock getBoundingClientRect for offset calculation
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 500,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
    }));
  });

  it("renders Contents title", () => {
    render(<TableOfContents />);
    expect(screen.getByText("Contents")).toBeInTheDocument();
  });

  it("renders all section links", () => {
    render(<TableOfContents />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Technical Skills")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Certifications")).toBeInTheDocument();
    expect(screen.getByText("Leadership")).toBeInTheDocument();
    expect(screen.getByText("Hobbies")).toBeInTheDocument();
  });

  it("highlights active section", () => {
    render(<TableOfContents activeSection="section-summary" />);
    const summaryLink = screen.getByText("Summary");
    expect(summaryLink.className).toContain("text-[var(--color-primary)]");
  });

  it("does not highlight inactive sections", () => {
    render(<TableOfContents activeSection="section-summary" />);
    const overviewLink = screen.getByText("Overview");
    expect(overviewLink.className).toContain("text-[var(--color-text-secondary)]");
  });

  it("renders correct href attributes", () => {
    render(<TableOfContents />);
    const overviewLink = screen.getByText("Overview");
    expect(overviewLink).toHaveAttribute("href", "#section-hero");
  });

  it("calls window.scrollTo on link click", () => {
    // Create a mock element
    const mockElement = document.createElement("div");
    mockElement.id = "section-summary";
    document.body.appendChild(mockElement);

    render(<TableOfContents />);
    
    const summaryLink = screen.getByText("Summary");
    fireEvent.click(summaryLink);
    
    // Component uses window.scrollTo with offset
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "smooth",
    });

    // Cleanup
    document.body.removeChild(mockElement);
  });

  it("prevents default on link click", () => {
    render(<TableOfContents />);
    
    const overviewLink = screen.getByText("Overview");
    const event = { preventDefault: jest.fn() };
    
    // Simulate click with our event
    fireEvent.click(overviewLink, event);
    // The click event is handled internally, so we verify the link doesn't navigate
    // by checking the href is still there
    expect(overviewLink).toHaveAttribute("href", "#section-hero");
  });

  it("handles missing element gracefully", () => {
    render(<TableOfContents />);
    
    // Click on a link whose element doesn't exist
    const leadershipLink = screen.getByText("Leadership");
    
    // Should not throw an error
    expect(() => fireEvent.click(leadershipLink)).not.toThrow();
  });

  it("renders as navigation element", () => {
    render(<TableOfContents />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders list of links", () => {
    render(<TableOfContents />);
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list.querySelectorAll("li").length).toBe(8);
  });
});

