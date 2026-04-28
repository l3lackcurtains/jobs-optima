import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Disabled - using regular build for Docker

  // Proxy /api/proxy/* to the internal backend so the browser never calls
  // the backend directly. INTERNAL_API_URL is resolved at runtime on the
  // Next.js server (Docker internal network or localhost in dev).
  async rewrites() {
    const internalApiUrl =
      process.env.INTERNAL_API_URL || "http://localhost:8888/api";
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${internalApiUrl}/:path*`,
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
  // webpack only runs for production builds (next build); dev uses Turbopack
  webpack: (config) => {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization?.splitChunks,
        cacheGroups: {
          ...config.optimization?.splitChunks?.cacheGroups,
          tanstack: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: "tanstack",
            chunks: "all",
            priority: 10,
          },
        },
      },
    };
    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
