/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");

const prod = process.env.NODE_ENV === "production";

module.exports = withPWA({
  dest: "public",            // ✅ moved out of `pwa: {}`
  register: true,            // ✅ directly here
  skipWaiting: true,
  disable: prod ? false : true,

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
});
