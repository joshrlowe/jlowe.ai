/**
 * Tests for the breadcrumb / collection schema.org builders
 */

import { breadcrumbSchema, collectionPageSchema, SITE_URL } from "@/lib/seo/schema";

describe("breadcrumbSchema", () => {
  it("builds a BreadcrumbList with 1-based positions and absolute item URLs", () => {
    const schema = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Projects", path: "/projects" },
      { name: "My Project", path: "/projects/my-project" },
    ]);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: { "@id": SITE_URL } },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: { "@id": `${SITE_URL}/projects` },
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "My Project",
        item: { "@id": `${SITE_URL}/projects/my-project` },
      },
    ]);
  });

  it("passes absolute URLs through untouched", () => {
    const schema = breadcrumbSchema([{ name: "Elsewhere", path: "https://example.com/page" }]);

    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Elsewhere",
        item: { "@id": "https://example.com/page" },
      },
    ]);
  });
});

describe("collectionPageSchema", () => {
  const args = {
    title: "Projects",
    description: "All projects.",
    path: "/projects",
    items: [
      { name: "Alpha", path: "/projects/alpha" },
      { name: "Beta", path: "/projects/beta" },
    ],
  };

  it("builds a CollectionPage with an ItemList mainEntity", () => {
    const schema = collectionPageSchema(args);

    expect(schema["@type"]).toBe("CollectionPage");
    expect(schema.name).toBe("Projects");
    expect(schema.url).toBe(`${SITE_URL}/projects`);

    const mainEntity = schema.mainEntity as unknown as {
      "@type": string;
      numberOfItems: number;
      itemListElement: unknown[];
    };
    expect(mainEntity["@type"]).toBe("ItemList");
    expect(mainEntity.numberOfItems).toBe(2);
    expect(mainEntity.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Alpha", url: `${SITE_URL}/projects/alpha` },
      { "@type": "ListItem", position: 2, name: "Beta", url: `${SITE_URL}/projects/beta` },
    ]);
  });

  it("caps the ItemList at 20 entries and reports the emitted count", () => {
    const manyItems = Array.from({ length: 35 }, (_, i) => ({
      name: `Item ${i + 1}`,
      path: `/projects/item-${i + 1}`,
    }));
    const schema = collectionPageSchema({ ...args, items: manyItems });

    const mainEntity = schema.mainEntity as unknown as {
      numberOfItems: number;
      itemListElement: { position: number }[];
    };
    expect(mainEntity.itemListElement).toHaveLength(20);
    expect(mainEntity.numberOfItems).toBe(20);
    expect(mainEntity.itemListElement[19].position).toBe(20);
  });

  it("handles an empty item list", () => {
    const schema = collectionPageSchema({ ...args, items: [] });

    const mainEntity = schema.mainEntity as unknown as {
      numberOfItems: number;
      itemListElement: unknown[];
    };
    expect(mainEntity.numberOfItems).toBe(0);
    expect(mainEntity.itemListElement).toEqual([]);
  });
});
