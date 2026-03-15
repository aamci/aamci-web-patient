/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // NEXT_PUBLIC_API_BASE_URL is injected at build time via ARG in Dockerfile
  // or via NEXT_PUBLIC_API_BASE_URL env var at runtime for dev
  experimental: { typedRoutes: true },
};
module.exports = nextConfig;