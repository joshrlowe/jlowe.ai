import { render } from "@testing-library/react";
import JsonLd from "@/components/JsonLd";
import {
  personSchema,
  websiteSchema,
  blogPostingSchema,
  projectSchema,
} from "@/lib/seo/schema";

// next/head is mocked in jest.setup.js to render its children, so the
// <script> tag should appear in the rendered output.

describe("JsonLd component", () => {
  it("renders a JSON-LD script tag with the given schema payload", () => {
    const { container } = render(<JsonLd data={personSchema} id="person" />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.innerHTML).toContain('"@type":"Person"');
    expect(script?.innerHTML).toContain('"name":"Josh Lowe"');
  });

  it("does not pretty-print (stable serialization)", () => {
    const { container } = render(<JsonLd data={websiteSchema} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    // JSON.stringify with no spacing produces no newlines
    expect(script?.innerHTML).not.toContain("\n");
    expect(script?.innerHTML).toContain('"@type":"WebSite"');
  });

  it("escapes payload safely — no raw </script> can break out", () => {
    // schema-dts types don't allow arbitrary HTML strings in fields, but
    // strings can carry "</script>" payloads. JSON.stringify escapes the
    // forward slash to \\u003c... etc. would be ideal; at minimum verify
    // that we serialize via JSON (no raw HTML splicing).
    const evil = blogPostingSchema({
      title: 'evil </script><script>alert(1)</script>',
      description: "x",
      slug: "x",
      topic: "x",
    });
    const { container } = render(<JsonLd data={evil} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    // Raw <script> tag content stays inside the JSON string — it does NOT
    // appear as a literal opening "<script>" in the DOM output beyond the
    // wrapper itself, because innerHTML treats the encoded value as text.
    const innerHtml = script?.innerHTML ?? "";
    const occurrences = innerHtml.split("<script>").length - 1;
    expect(occurrences).toBe(0);
  });

  it("CreativeWork project schema produces the expected URL", () => {
    const payload = projectSchema({
      title: "NutriLLaVA",
      description: "Vision-language nutrition model",
      slug: "nutrillava",
    });
    expect(payload.url).toBe("https://jlowe.ai/projects/nutrillava");
    expect(payload["@type"]).toBe("CreativeWork");
  });

  it("BlogPosting schema falls back dateModified to datePublished when missing", () => {
    const payload = blogPostingSchema({
      title: "T",
      description: "D",
      slug: "s",
      topic: "engineering",
      datePublished: new Date("2026-01-01T00:00:00Z"),
    });
    expect(payload.datePublished).toBe(payload.dateModified);
    expect(payload.url).toBe("https://jlowe.ai/articles/engineering/s");
  });
});
