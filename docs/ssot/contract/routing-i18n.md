# Routing And I18n Contract

## Source Of Truth

- Locale list: `site.locale.json`
- Route parser: `lib/context/url-parser.ts`
- Route builder: `lib/context/build-page-url.ts`
- Page route files: `pages/post/[...slug].tsx`,
  `pages/category/[slug].tsx`, `pages/tag/[tag].tsx`

## Contract

- Canonical public routes include locale prefixes for localized pages.
- Root `/` remains valid and maps to the default locale experience.
- Generated post, category, and tag URLs must use encoded path segments.
- URL parser must accept both absolute URLs and path-only URLs.

## Verification

- `npm run build`
- `curl -s http://localhost:<port>/sitemap.xml`
- Confirm localized routes exist, for example `/en/post/...` and `/ko/post/...`.
