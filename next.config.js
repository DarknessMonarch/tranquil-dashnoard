/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },

      {
        protocol: 'https',
        hostname: 's3.swiftsyn.com',
        port: '',
        pathname: '/rental/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8501',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8501',
        pathname: '/api/v1/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8501',
        pathname: '/api/v1/uploads/profiles/**',
      }
    ],
  },
};

module.exports = nextConfig;
