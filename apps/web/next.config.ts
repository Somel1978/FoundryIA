import type { NextConfig } from "next";

/**
 * Extra hostnames allowed to submit Server Actions, comma-separated
 * (e.g. "code.example.com"). Normally unnecessary: cloudflared forwards the
 * public Host header, which already matches the browser's Origin.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Cloudflare terminates TLS, so the browser always talks HTTPS to us.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@foundry/db", "@foundry/storage", "@foundry/env"],
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Fix suggestions carry whole file contents.
      bodySizeLimit: "4mb",
      allowedOrigins,
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin pages must never be cached by Cloudflare or the browser.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
