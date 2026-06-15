import localeConfig from '../site.locale.json'

import { host } from './config'
import { buildPageUrl } from './context/build-page-url'
import type { PageInfo, SiteMap } from './context/types'

export interface SitemapEntry {
  loc: string
  lastmod?: string | null
}

export function absoluteUrl(
  value?: string | null,
  baseUrl: string = host
): string | undefined {
  if (!value) return undefined

  try {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    return new URL(value, base).toString()
  } catch {
    return undefined
  }
}

export function collectSitemapEntries(siteMap: SiteMap): SitemapEntry[] {
  const entries = new Map<string, SitemapEntry>()

  const add = (path: string, lastmod?: string | null) => {
    const loc = absoluteUrl(path)
    if (!loc) return

    const normalizedLastmod = normalizeLastmod(lastmod)
    entries.set(loc, {
      loc,
      lastmod: normalizedLastmod
    })
  }

  add('/')

  for (const locale of localeConfig.localeList) {
    add(`/${locale}`)
    add(`/${locale}/all-tags`)
  }

  for (const pageInfo of Object.values(siteMap.pageInfoMap)) {
    const pagePath = buildPageInfoPath(pageInfo, siteMap)
    if (!pagePath) continue

    add(pagePath, pageInfo.date)
  }

  for (const dbInfo of Object.values(siteMap.databaseInfoMap || {})) {
    const locale = getSupportedLocale(dbInfo.language)
    add(`/${locale}/category/${encodePathSegment(dbInfo.slug)}`)
  }

  for (const [locale, localeTagData] of Object.entries(
    siteMap.tagGraphData?.locales || {}
  )) {
    const supportedLocale = getSupportedLocale(locale)

    for (const tag of Object.keys(localeTagData.tagCounts || {})) {
      add(`/${supportedLocale}/tag/${encodePathSegment(tag)}`)
    }
  }

  return Array.from(entries.values()).sort((a, b) => a.loc.localeCompare(b.loc))
}

export function renderSitemapXml(siteMap: SiteMap): string {
  const entries = collectSitemapEntries(siteMap)

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => {
    const lastmod = entry.lastmod
      ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
      : ''

    return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmod}
  </url>`
  })
  .join('\n')}
</urlset>
`
}

function buildPageInfoPath(
  pageInfo: PageInfo,
  siteMap: SiteMap
): string | null {
  if (!pageInfo.public || !pageInfo.slug) return null

  const locale = getSupportedLocale(pageInfo.language)

  if (pageInfo.type === 'Post' || pageInfo.type === 'Home') {
    return buildPageUrl(pageInfo.pageId, siteMap, [], locale)
  }

  if (pageInfo.type === 'Category' || pageInfo.type === 'Database') {
    return `/${locale}/category/${encodePathSegment(pageInfo.slug)}`
  }

  return null
}

function getSupportedLocale(locale?: string | null): string {
  return locale && localeConfig.localeList.includes(locale)
    ? locale
    : localeConfig.defaultLocale
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment)
}

function normalizeLastmod(lastmod?: string | null): string | null {
  if (!lastmod) return null

  const date = new Date(lastmod)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
