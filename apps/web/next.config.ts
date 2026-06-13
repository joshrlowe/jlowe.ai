import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export to S3 + CloudFront. Headers, redirects, and 404 mapping are
  // owned by the CDN (infra/terraform/modules/cdn) — they are unsupported here
  // under `output: "export"` and must not be added.
  output: "export",
  // Every route exports as <route>/index.html; pairs with the CloudFront
  // viewer-request function that appends index.html to directory URIs.
  trailingSlash: true,
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    // No image optimization server in a static export.
    unoptimized: true,
  },
};

export default nextConfig;
