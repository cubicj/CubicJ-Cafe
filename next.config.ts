import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@discordjs/ws',
    'zlib-sync',
    'bufferutil',
    'utf-8-validate',
  ],
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      'lucide-react'
    ],
    optimizeCss: true,
  },

  images: {
    dangerouslyAllowLocalIP: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // 동적으로 BASE URL에서 hostname 추출
      ...(process.env.APP_URL ? [{
        protocol: process.env.APP_URL.startsWith('https') ? 'https' as const : 'http' as const,
        hostname: new URL(process.env.APP_URL).hostname,
      }] : []),
      // ComfyUI API URL에서 동적으로 hostname 추출
      ...(process.env.COMFYUI_API_URL ? [{
        protocol: process.env.COMFYUI_API_URL.startsWith('https') ? 'https' as const : 'http' as const,
        hostname: new URL(process.env.COMFYUI_API_URL).hostname,
      }] : []),
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['log', 'warn', 'error', 'debug'] } : false,
  },

  poweredByHeader: false,

  compress: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  output: 'standalone',

  outputFileTracingExcludes: {
    '*': ['.git/**', '.claude/**', '.serena/**', 'Docs/**'],
  },
};

export default nextConfig;
