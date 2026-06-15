# Sitemap Feed Robots Contract

## Source Of Truth

- Sitemap collection and XML rendering: `lib/seo.ts`
- Sitemap route: `pages/sitemap.xml.tsx`
- Robots route: `pages/robots.txt.tsx`
- RSS feed route: `pages/feed.tsx`

## Contract

- `robots.txt`, `sitemap.xml`, and `feed` must support both `GET` and `HEAD`.
- Production robots output allows crawling and points to the absolute sitemap.
- Preview and development may disallow crawling, but Node production builds
  without `VERCEL_ENV` must still allow crawling.
- Sitemap must contain real public routes, not internal page IDs.
- RSS feed item URLs and image enclosures must be absolute.

## Verification

- `curl -I http://localhost:<port>/robots.txt`
- `curl -I http://localhost:<port>/sitemap.xml`
- `curl -s http://localhost:<port>/sitemap.xml | rg '<loc>' | wc -l`
- `curl -s http://localhost:<port>/feed | rg '<item>|<enclosure'`
