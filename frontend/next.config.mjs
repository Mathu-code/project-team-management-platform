/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is run explicitly in CI; do not block the production build on lint warnings.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
