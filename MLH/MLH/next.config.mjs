/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/tax-twins/initialize',
        destination: '/api/v1/tax/twin',
      },
      {
        source: '/api/v1/tax-twins/:id',
        destination: '/api/v1/tax/twin/:id',
      },
      {
        source: '/api/v1/tax-twins/:id/:path*',
        destination: '/api/v1/tax/twin/:id/:path*',
      },
    ];
  },
};

export default nextConfig;
