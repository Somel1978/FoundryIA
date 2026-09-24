import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@foundry/db", "@foundry/storage", "@foundry/env"],
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // Fix suggestions carry whole file contents.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
