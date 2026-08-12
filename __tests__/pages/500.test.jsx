/**
 * Tests for the custom 500 page
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ServerErrorPage from "@/pages/500";

describe("500 page", () => {
  it("renders the error heading", () => {
    render(<ServerErrorPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Something Went Wrong");
  });

  it("sets the page title", () => {
    render(<ServerErrorPage />);
    expect(document.title).toBe("Something Went Wrong | Josh Lowe");
  });

  it("asks crawlers not to index the page", () => {
    render(<ServerErrorPage />);
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute("content", "noindex, nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("links back to home and contact", () => {
    render(<ServerErrorPage />);
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /contact me/i })).toHaveAttribute("href", "/contact");
  });
});
