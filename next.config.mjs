const securityHeaders = [
  // 2 years; no `preload` — the preload list is effectively irreversible, so
  // that flag is deferred until after the v2 cutover has burned in.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // NOTE: no Content-Security-Policy yet — deliberately deferred. The hero runs
  // Three.js blob: workers plus Next.js inline bootstrap scripts, so a workable
  // CSP needs worker-src blob: + script nonce plumbing. Revisit with v2.
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // https-only: the plaintext-http optimizer origin was an unnecessary SSRF
    // surface. The wildcard host still wants tightening to the known image
    // hosts (Vercel Blob) — pending a prod DB enumeration of legacy image URLs.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // On server side, mark next-auth providers as externals to avoid bundling
      config.externals = config.externals || [];
      config.externals.push({
        "next-auth/providers/credentials": "commonjs next-auth/providers/credentials",
      });
    } else {
      // Client-side fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        // Security headers on every route, including /api and /admin.
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Apply to all public pages (exclude admin and API routes)
        source: "/((?!admin|api).*)",
        headers: [
          {
            key: "Cache-Control",
            // max-age=0: Browser always revalidates with CDN
            // s-maxage=60: CDN caches for 60 seconds (matches ISR revalidate)
            // stale-while-revalidate=900: Serve stale for up to 15 min while revalidating
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=900",
          },
        ],
      },
      {
        // Admin routes should not be cached
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
