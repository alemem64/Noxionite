# Notion Content Contract

## Source Of Truth

- Site databases: `notionDbIds` in `site.config.ts`
- Notion API wrapper: `lib/notion-api.ts`
- Site map assembly: `lib/context/get-site-map.ts`
- Cache entry point: `lib/context/site-cache.ts`
- Page metadata model: `lib/context/types.ts`

## Contract

- Public pages require at least title, slug, type, language, and public state.
- Invalid or incomplete Notion rows should be skipped with warnings, not crash
  the whole build.
- Build and runtime should use the cached site map when available to avoid
  repeated Notion API calls.
- Transient Notion API errors may reduce generated paths for that run, but must
  not corrupt committed source files.

## Verification

- `npm run build`
- Check build logs for page counts and skipped-page warnings.
- Confirm multiple `/post/...`, `/category/...`, and `/tag/...` routes are
  generated for the target site.
