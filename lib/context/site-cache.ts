import type { SiteMap } from './types.ts'
import { getSiteMap } from './get-site-map.ts'


let siteMapCache: SiteMap | null = null
let lastUpdated = 0
let cacheUpdatePromise: Promise<SiteMap> | null = null

const CACHE_DURATION_MS = 60_000 // 60 seconds
const SKIP_SOCIAL_SYNC_LIFECYCLES = new Set(['build', 'postbuild'])

function shouldSyncSocialImages() {
  return (
    typeof window === 'undefined' &&
    process.env.NODE_ENV !== 'development' &&
    !SKIP_SOCIAL_SYNC_LIFECYCLES.has(process.env.npm_lifecycle_event || '') &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  )
}

async function fetchAndCacheSiteMap(): Promise<SiteMap> {
  
  const newSiteMap = await getSiteMap()
  siteMapCache = newSiteMap
  lastUpdated = Date.now()

  
  // Trigger social image sync after site map update (server-side only)
  if (shouldSyncSocialImages()) {
    void (async () => {
      try {
        const { syncSocialImagesWithSiteMap } = await import('../og-images-manager')
        await syncSocialImagesWithSiteMap(newSiteMap)
      } catch (err) {
        console.error('Failed to sync social images:', err)
      }
    })()
  }
  
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
