/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'syd.cloud.appwrite.io', // your region hostname
        pathname: '/v1/storage/buckets/**', // allow all storage URLs
      },
    ],
  },
};

module.exports = nextConfig;
