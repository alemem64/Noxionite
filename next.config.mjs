import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bundleAnalyzer from '@next/bundle-analyzer'
import locale from './site.locale.json' with { type: 'json' }

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

export default withBundleAnalyzer({
  staticPageGenerationTimeout: 300,
  // OpenNext(Cloudflare) 번들이 workerd 조건으로 ofetch/dist/index.mjs를 요구하는데
  // 기본 트레이싱은 Node 엔트리만 복사하므로 dist 전체를 포함시킨다 (2026-07-13)
  outputFileTracingIncludes: {
    '*': [
      './node_modules/.pnpm/ofetch@*/node_modules/ofetch/dist/**',
      './node_modules/ofetch/dist/**'
    ]
  },
  i18n: {
    locales: locale.localeList,
    defaultLocale: locale.defaultLocale
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'user-images.githubusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'http', hostname: 'localhost', port: '3000' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  webpack: (config, { isServer }) => {
    const dirname = path.dirname(fileURLToPath(import.meta.url))
    config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
    config.resolve.alias['react-dom'] = path.resolve(
      dirname,
      'node_modules/react-dom'
    )
    
    // Exclude Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        zlib: false,
        http: false,
        https: false,
        url: false,
        querystring: false,
        punycode: false,
        string_decoder: false,
        buffer: false,
        'node:fs': false,
        'node:path': false,
        'node:os': false,
        'node:crypto': false,
        'node:stream': false,
        'node:util': false,
        'node:zlib': false,
        'node:http': false,
        'node:https': false,
        'node:url': false,
        'node:querystring': false,
        'node:punycode': false,
        'node:string_decoder': false,
        'node:buffer': false,
      }
    }
    
    return config
  },

  transpilePackages: ['react-tweet']
})
