/**
 * Tests for SEO component
 *
 * next/router is mocked globally in jest.setup.js with asPath "/"; tests that
 * need a different route queue a one-shot return value on that mock.
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/router";
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
      "Full Stack Developer specializing in modern web technologies."
    );
  });

  it("renders Open Graph title", () => {
    render(<SEO title="OG Test" />);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle).toHaveAttribute("content", "OG Test | Josh Lowe");
  });

  it("renders Open Graph description", () => {
    render(<SEO description="OG Description" />);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    expect(ogDescription).toHaveAttribute("content", "OG Description");
  });

  it("makes relative Open Graph images absolute", () => {
    render(<SEO image="/images/test.png" />);
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toHaveAttribute("content", "https://jlowe.ai/images/test.png");
  });

  it("passes absolute Open Graph images through untouched", () => {
    render(<SEO image="https://cdn.example.com/card.png" />);
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toHaveAttribute("content", "https://cdn.example.com/card.png");
  });

  it("renders default Open Graph image", () => {
    render(<SEO />);
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toHaveAttribute("content", "https://jlowe.ai/og-default.png");
  });

  it("renders og:image dimensions for the default image", () => {
    render(<SEO />);
    const ogImageWidth = document.querySelector('meta[property="og:image:width"]');
    const ogImageHeight = document.querySelector('meta[property="og:image:height"]');
    expect(ogImageWidth).toHaveAttribute("content", "1200");
    expect(ogImageHeight).toHaveAttribute("content", "630");
  });

  it("omits og:image dimensions for custom images", () => {
    render(<SEO image="/images/test.png" />);
    expect(document.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image:height"]')).toBeNull();
  });

  it("renders og:image:alt from the page title", () => {
    render(<SEO title="Alt Test" />);
    const ogImageAlt = document.querySelector('meta[property="og:image:alt"]');
    expect(ogImageAlt).toHaveAttribute("content", "Alt Test | Josh Lowe");
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
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    expect(twitterDescription).toHaveAttribute("content", "Twitter Description");
  });

  it("renders absolute Twitter image", () => {
    render(<SEO image="/images/twitter.png" />);
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    expect(twitterImage).toHaveAttribute("content", "https://jlowe.ai/images/twitter.png");
  });

  it("renders robots meta", () => {
    render(<SEO />);
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute("content", "index, follow");
  });

  it("renders noindex robots meta and drops the canonical when noindex is set", () => {
    render(<SEO noindex />);
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute("content", "noindex, nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("renders canonical link from explicit url prop", () => {
    render(<SEO url="https://jlowe.ai/page" />);
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toHaveAttribute("href", "https://jlowe.ai/page");
  });

  it("defaults the homepage canonical to the site URL", () => {
    render(<SEO />);
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toHaveAttribute("href", "https://jlowe.ai");
  });

  it("derives the canonical from the current route when url is omitted", () => {
    useRouter.mockReturnValueOnce({ asPath: "/projects" });
    render(<SEO title="Projects" />);
    const canonical = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(canonical).toHaveAttribute("href", "https://jlowe.ai/projects");
    expect(ogUrl).toHaveAttribute("content", "https://jlowe.ai/projects");
  });

  it("strips query string and hash from the derived canonical", () => {
    useRouter.mockReturnValueOnce({ asPath: "/projects?tag=ai#top" });
    render(<SEO title="Projects" />);
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toHaveAttribute("href", "https://jlowe.ai/projects");
  });

  it("prefers an explicit url prop over the current route", () => {
    useRouter.mockReturnValueOnce({ asPath: "/projects" });
    render(<SEO url="https://jlowe.ai/custom" />);
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toHaveAttribute("href", "https://jlowe.ai/custom");
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
