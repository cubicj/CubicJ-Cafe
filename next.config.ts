import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// ecosystem.config.js에서 환경변수 로드
try {
  const ecosystemConfig = require('./ecosystem.config.js');
  const envConfig = process.env.NODE_ENV === 'production' 
    ? ecosystemConfig.apps[0].env_production 
    : ecosystemConfig.apps[0].env;
  
  Object.keys(envConfig).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = envConfig[key];
    }
  });
} catch (error) {
  console.warn('⚠️ ecosystem.config.js 로드 실패:', error);
}

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      'lucide-react'
    ],
    optimizeCss: true,
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  images: {
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
      ...(process.env.NEXTAUTH_URL ? [{
        protocol: process.env.NEXTAUTH_URL.startsWith('https') ? 'https' as const : 'http' as const,
        hostname: new URL(process.env.NEXTAUTH_URL).hostname,
      }] : []),
      // ComfyUI API URL에서 동적으로 hostname 추출
      ...(process.env.COMFYUI_API_URL ? [{
        protocol: process.env.COMFYUI_API_URL.startsWith('https') ? 'https' as const : 'http' as const,
        hostname: new URL(process.env.COMFYUI_API_URL).hostname,
      }] : []),
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module: any) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
              return `npm.${packageName?.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            priority: 20,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    config.externals = config.externals || [];
    
    if (isServer) {
      config.externals.push({
        'zlib-sync': 'commonjs zlib-sync',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      });
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'zlib-sync': false,
        'bufferutil': false,
        'utf-8-validate': false,
      };
    }

    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },

  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  output: 'standalone',
};

export default withBundleAnalyzer(nextConfig);
