/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "192.168.219.101",
    "192.168.219.101:3000",
    "localhost:3000",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.219.101",
        "192.168.219.101:3000",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
