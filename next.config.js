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
        hostname: 'minio.swiftsyn.com',
        port: '',
        pathname: '/**',
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
