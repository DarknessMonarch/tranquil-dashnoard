/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Minio
      {
        protocol: 'https',
        hostname: 'minio.swiftsyn.com',
        pathname: '/backroomscript/**',
      },

      // Localhost patterns
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
      },

      // Replace wildcard with explicit hostnames
      {
        protocol: 'https',
        hostname: 'backroomscript.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.backroomscript.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'backroomscript.com',
        pathname: '/api/v1/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.backroomscript.com',
        pathname: '/api/v1/uploads/**',
      },
    ],
  },
};

export default nextConfig;
