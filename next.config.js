/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== "production", // disabled in dev
});

const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      "images.unsplash.com",
      "unsplash.com",
      "rb.gy",
      "res.cloudinary.com",
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, process: false };
    return config;
  },
};

module.exports = withPWA(nextConfig);
