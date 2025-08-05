/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");
const prod = process.env.NODE_ENV === "production";

module.exports = withPWA({
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: prod ? false : true,
  },
  reactStrictMode: false,
  
  // Add these for Firebase hosting
  output: 'export',
  trailingSlash: true,
  
  images: {
    unoptimized: true, // Required for static export
    domains: [
      "images.unsplash.com",
      "unsplash.com",
      "rb.gy",
      "res.cloudinary.com",
    ],
  },
  
  // Add these to ignore build errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  webpack5: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { 
      fs: false, 
      path: false, 
      process: false,
      net: false,
      tls: false
    };
    
    // Add this to handle Firebase circular reference issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'firebase/app': 'firebase/app',
        'firebase/firestore': 'firebase/firestore',
        'firebase/auth': 'firebase/auth'
      });
    }
    
    return config;
  },
});