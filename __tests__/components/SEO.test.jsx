/**
 * Tests for SEO component
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import SEO from "@/components/SEO";

describe("SEO", () => {
  it("renders default title", () => {
    render(<SEO />);
    expect(document.title).toBe("Josh Lowe");
  });

  it("appends site name to custom title", () => {
    render(<SEO title="Projects" />);
    expect(document.title).toBe("Projects | Josh Lowe");
  });

  it("does not duplicate site name if already in title", () => {
    render(<SEO title="Projects | Josh Lowe" />);
    expect(document.title).toBe("Projects | Josh Lowe");
  });

  it("renders meta description", () => {
    render(<SEO description="Test description" />);
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription).toHaveAttribute("content", "Test description");
  });

  it("renders default meta description", () => {
    render(<SEO />);
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription).toHaveAttribute(
      "content",
      "Full Stack Developer specializing in modern web technologies.",
    );
  });

  it("renders Open Graph title", () => {
    render(<SEO title="OG Test" />);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle).toHaveAttribute("content", "OG Test | Josh Lowe");
  });

  it("renders Open Graph description", () => {
    render(<SEO description="OG Description" />);
    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );
    expect(ogDescription).toHaveAttribute("content", "OG Description");
  });

  it("renders Open Graph image", () => {
    render(<SEO image="/images/test.png" />);
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toHaveAttribute("content", "/images/test.png");
  });

  it("renders default Open Graph image", () => {
    render(<SEO />);
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toHaveAttribute("content", "/images/logo.png");
  });

  it("renders Open Graph URL", () => {
    render(<SEO url="https://example.com/page" />);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl).toHaveAttribute("content", "https://example.com/page");
  });

  it("renders Open Graph type", () => {
    render(<SEO type="article" />);
    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType).toHaveAttribute("content", "article");
  });

  it("renders default Open Graph type", () => {
    render(<SEO />);
    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType).toHaveAttribute("content", "website");
  });

  it("renders Twitter card meta", () => {
    render(<SEO />);
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    expect(twitterCard).toHaveAttribute("content", "summary_large_image");
  });

  it("renders Twitter title", () => {
    render(<SEO title="Twitter Test" />);
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    expect(twitterTitle).toHaveAttribute("content", "Twitter Test | Josh Lowe");
  });

  it("renders Twitter description", () => {
    render(<SEO description="Twitter Description" />);
    const twitterDescription = document.querySelector(
      'meta[name="twitter:description"]',
    );
    expect(twitterDescription).toHaveAttribute("content", "Twitter Description");
  });

  it("renders Twitter image", () => {
    render(<SEO image="/images/twitter.png" />);
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    expect(twitterImage).toHaveAttribute("content", "/images/twitter.png");
  });

  it("renders robots meta", () => {
    render(<SEO />);
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute("content", "index, follow");
  });

  it("renders canonical link", () => {
    render(<SEO url="https://jlowe.ai/page" />);
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toHaveAttribute("href", "https://jlowe.ai/page");
  });

  it("renders viewport meta", () => {
    render(<SEO />);
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).toHaveAttribute("content", "width=device-width, initial-scale=1");
  });

  it("renders og:site_name", () => {
    render(<SEO />);
    const siteName = document.querySelector('meta[property="og:site_name"]');
    expect(siteName).toHaveAttribute("content", "Josh Lowe");
  });
});

