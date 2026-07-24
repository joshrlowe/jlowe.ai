import Head from "next/head";
import type { Thing, WithContext } from "schema-dts";

interface JsonLdProps<T extends Thing> {
  /** schema.org payload — must already include `@context: "https://schema.org"` */
  data: WithContext<T>;
  /** Optional id; helpful when multiple JSON-LD blobs render on one page. */
  id?: string;
}

/**
 * Renders a typed JSON-LD `<script type="application/ld+json">` inside next/head.
 *
 * Use one per logical entity (page = WebPage/Article/CreativeWork; sitewide
 * = WebSite + Person). Multiple JsonLd blocks can coexist on one page; pass a
 * unique `id` to keep React/next/head reconciliation stable.
 *
 * The data prop accepts any schema-dts WithContext<T>; consumers cite specific
 * types (Person, WebSite, CreativeWork, BlogPosting, etc.) at the call site so
 * the @type field is enforced statically.
 */
export default function JsonLd<T extends Thing>({ data, id }: JsonLdProps<T>) {
  // Escape `<` to `<` so a `</script>` substring inside any string field
  // can't break out of the wrapping <script> tag.
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <Head>
      <script
        key={id ?? `json-ld-${(data as { "@type"?: string })["@type"] ?? "schema"}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialized }}
      />
    </Head>
  );
}
