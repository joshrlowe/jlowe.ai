// The Twitter card reuses the Open Graph image. Re-exporting keeps a single
// source of truth for the branded card art.
export const dynamic = "force-static";

export { default, alt, size, contentType } from "./opengraph-image";
