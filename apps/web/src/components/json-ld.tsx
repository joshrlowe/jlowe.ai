import type { Thing, WithContext } from "schema-dts";

interface JsonLdProps<T extends Thing> {
  /** schema.org payload — must already include `@context: "https://schema.org"` */
  data: WithContext<T>;
  /** Optional id; helpful when multiple JSON-LD blobs render on one page. */
  id?: string;
}

/**
 * Renders a typed JSON-LD `<script type="application/ld+json">`.
 *
 * App Router adaptation of the v1 component: there is no `next/head` in the
 * App Router, so the script is emitted inline as a server component. Next
 * hoists it into the document without hydration cost. Use one per logical
 * entity (sitewide = WebSite + Person; a detail page = Article/CreativeWork).
 */
export function JsonLd<T extends Thing>({ data, id }: JsonLdProps<T>) {
  // Escape `<` to `<` so a `</script>` substring inside any string field
  // can't break out of the wrapping <script> tag.
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
