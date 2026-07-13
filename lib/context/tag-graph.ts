import localeConfig from '../../site.locale.json'
import type { PageInfo, SiteMap } from './types'

export interface LocaleTagGraphData {
  // Tag frequency counts for this locale
  tagCounts: Record<string, number>

  // Tag relationships (co-occurrences) - using array for JSON serialization
  tagRelationships: Record<string, string[]>

  // Which pages contain each tag for reverse lookup
  tagPages: Record<string, string[]>

  // Metadata for this locale
  totalPosts: number
  lastUpdated: number
}

export interface TagGraphData {
  // Locale-specific tag graph data
  locales: Record<string, LocaleTagGraphData>

  // Global metadata
  totalPosts: number
  lastUpdated: number
}

export function buildTagGraphData(siteMap: SiteMap): TagGraphData {
  const pageInfos = Object.values(siteMap.pageInfoMap)
  const localeData: Record<string, LocaleTagGraphData> = {}

  // Group pages by locale (using language field)
  const pagesByLocale: Record<string, typeof pageInfos> = {}

  for (const pageInfo of pageInfos) {
    const locale = pageInfo.language || localeConfig.defaultLocale
    if (!pagesByLocale[locale]) {
      pagesByLocale[locale] = []
    }
    pagesByLocale[locale].push(pageInfo)
  }

  // Process each locale separately
  for (const [locale, localePageInfos] of Object.entries(pagesByLocale)) {
    // Filter only Post and Home type pages that have tags for this locale
    const relevantPages = localePageInfos.filter(
      (pageInfo) =>
        (pageInfo.type === 'Post' || pageInfo.type === 'Home') &&
        pageInfo.tags &&
        pageInfo.tags.length > 0
    )

    const tagCounts: Record<string, number> = {}
    const tagRelationships: Record<string, Set<string>> = {}
    const tagPages: Record<string, string[]> = {}

    // Process each page for this locale
    for (const pageInfo of relevantPages) {
      const tags = [...new Set(pageInfo.tags || [])] // Remove duplicates

      // Count tag occurrences
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1

        // Map tag to page
        if (!tagPages[tag]) {
          tagPages[tag] = []
        }
        if (!tagPages[tag].includes(pageInfo.pageId)) {
          tagPages[tag].push(pageInfo.pageId)
        }
      }

      // Build relationships between tags in the same page
      if (tags.length >= 2) {
        for (let i = 0; i < tags.length; i++) {
          const tagA = tags[i]
          if (!tagRelationships[tagA]) {
            tagRelationships[tagA] = new Set()
          }

          for (let j = i + 1; j < tags.length; j++) {
            const tagB = tags[j]
            tagRelationships[tagA].add(tagB)

            if (!tagRelationships[tagB]) {
              tagRelationships[tagB] = new Set()
            }
            tagRelationships[tagB].add(tagA)
          }
        }
      }
    }

    // Convert Sets to sorted arrays for JSON serialization
    const sortedTagRelationships: Record<string, string[]> = {}
    for (const [tag, relatedTags] of Object.entries(tagRelationships)) {
      sortedTagRelationships[tag] = Array.from(relatedTags).toSorted()
    }

    // Sort tag pages for consistent ordering
    const sortedTagPages: Record<string, string[]> = {}
    for (const [tag, pages] of Object.entries(tagPages)) {
      sortedTagPages[tag] = [...new Set(pages)].toSorted()
    }

    localeData[locale] = {
      tagCounts,
      tagRelationships: sortedTagRelationships,
      tagPages: sortedTagPages,
      totalPosts: relevantPages.length,
      lastUpdated: getStableLastUpdated(relevantPages, siteMap.lastUpdated)
    }
  }

  return {
    locales: localeData,
    totalPosts: pageInfos.length,
    lastUpdated: siteMap.lastUpdated
  }
}

function getStableLastUpdated(
  pageInfos: PageInfo[],
  fallbackLastUpdated: number
): number {
  const latestPageTime = pageInfos.reduce((latest, page) => {
    if (!page.date) {
      return latest
    }

    const pageTime = new Date(page.date).getTime()
    return Number.isNaN(pageTime) ? latest : Math.max(latest, pageTime)
  }, 0)

  return latestPageTime || fallbackLastUpdated
}

export function getTopTags(
  tagGraphData: TagGraphData,
  locale = localeConfig.defaultLocale,
  limit = 20
): Array<[string, number]> {
  const localeData = tagGraphData.locales[locale]
  if (!localeData) return []

  return Object.entries(localeData.tagCounts)
    .toSorted(([, countA], [, countB]) => countB - countA)
    .slice(0, limit)
}

export function getRelatedTags(
  tagGraphData: TagGraphData,
  tagName: string,
  locale = localeConfig.defaultLocale
): string[] {
  const localeData = tagGraphData.locales[locale]
  if (!localeData) return []

  return localeData.tagRelationships[tagName] || []
}

export function getPagesWithTag(
  tagGraphData: TagGraphData,
  tagName: string,
  locale = localeConfig.defaultLocale
): string[] {
  const localeData = tagGraphData.locales[locale]
  if (!localeData) return []

  return localeData.tagPages[tagName] || []
}
