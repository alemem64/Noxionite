# SEO And Open Graph Contract

## Source Of Truth

- Head tags: `components/PageHead.tsx`
- Absolute URL helper: `lib/seo.ts`
- OG image URL helper: `lib/get-social-image-url.ts`
- Dynamic OG image API: `pages/api/og.tsx`

## Contract

- SEO and Open Graph tags must be server-rendered, not filled only by client
  effects.
- Canonical, `og:url`, `twitter:url`, `og:image`, and `twitter:image` must be
  absolute URLs.
- `og:image` points to `/api/og`, which returns a 1200x630 PNG generated with
  `next/og` and no Chromium dependency.
- Pages must emit `robots` content with `index,follow,max-image-preview:large`
  unless a future explicit noindex contract is added.

## Verification

- `npm run build`
- `npm run start`
- `curl -s http://localhost:<port>/en/post/<slug> | rg 'og:image|canonical|robots'`
- `curl -I 'http://localhost:<port>/api/og?title=Test'`
