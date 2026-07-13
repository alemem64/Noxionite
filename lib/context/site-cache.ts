import type { SiteMap } from './types.ts'
import { getSiteMap } from './get-site-map.ts'

let siteMapCache: SiteMap | null = null
let lastUpdated = 0
let cacheUpdatePromise: Promise<SiteMap> | null = null

const CACHE_DURATION_MS = 10 * 60_000

async function fetchAndCacheSiteMap(): Promise<SiteMap> {
  // Runtime social image sync(puppeteer) was removed for the Cloudflare Workers
  // runtime — social images come from the build step (scripts/generate-og-images.tsx).
  const newSiteMap = await getSiteMap()
  siteMapCache = newSiteMap
  lastUpdated = Date.now()

  return newSiteMap
}

export async function getCachedSiteMap(): Promise<SiteMap> {
  const now = Date.now()
  const isCacheStale = !siteMapCache || now - lastUpdated > CACHE_DURATION_MS

  if (siteMapCache && !isCacheStale) {
    return siteMapCache
  }

  if (cacheUpdatePromise) {
    // eslint-disable-next-line no-return-await
    return await cacheUpdatePromise
  }

  if (siteMapCache && isCacheStale) {
    // Don't await, let it run in the background
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchAndCacheSiteMap()
    return siteMapCache
  }

  // First load, or cache is empty and stale
  cacheUpdatePromise = fetchAndCacheSiteMap()
  try {
    return await cacheUpdatePromise
  } finally {
    cacheUpdatePromise = null
  }
}
