/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://qldrlbe-e8grfucshahbe2d4.eastasia-01.azurewebsites.net/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;