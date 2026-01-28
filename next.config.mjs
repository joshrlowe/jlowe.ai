/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
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
        "next-auth/providers/credentials":
          "commonjs next-auth/providers/credentials",
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
