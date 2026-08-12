/**
 * Tests for the custom 404 page
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotFoundPage from "@/pages/404";

describe("404 page", () => {
  it("renders the not-found heading", () => {
    render(<NotFoundPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page Not Found");
  });

  it("sets the page title", () => {
    render(<NotFoundPage />);
    expect(document.title).toBe("404 — Page Not Found | Josh Lowe");
  });

  it("asks crawlers not to index the page", () => {
    render(<NotFoundPage />);
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute("content", "noindex, nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("links back to key destinations", () => {
    render(<NotFoundPage />);
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /view projects/i })).toHaveAttribute(
      "href",
      "/projects"
    );
    expect(screen.getByRole("link", { name: /read articles/i })).toHaveAttribute(
      "href",
      "/articles"
    );
  });
});
