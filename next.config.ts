/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {},
    turbo: false, 
  },
};

module.exports = nextConfig;