/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@repo/ui",
    "@repo/trpc",
    "@t3-oss/env-nextjs",
    "@t3-oss/env-core"
  ],
};

module.exports = nextConfig;
