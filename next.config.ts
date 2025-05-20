/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
    turbo: false, 
  },
};

module.exports = nextConfig;