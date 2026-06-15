import type { SiteMap } from './types'
import localeConfig from '../../site.locale.json'

/**
 * Builds hierarchical URLs for pages based on current navigation context.
 * - Root pages: /post/{slug}
 * - Subpages: /post/{current-slug}/{subpage-title}-{pageId}
 * - Deep nested: /post/{current-slug}/{parent-title}-{parentId}/{subpage-title}-{pageId}
 */
export function buildPageUrl(
  pageId: string,
  siteMap: SiteMap,
  _currentPath: string[] = [],
  locale: string = localeConfig.defaultLocale
): string {
  const pageInfo = siteMap.pageInfoMap[pageId]

  // Root page (Post/Home with slug)
  if (pageInfo && (pageInfo.type === 'Post' || pageInfo.type === 'Home')) {
    return `/${locale}/post/${pageInfo.slug}`
  }

  // Subpage - use current path context
  if (_currentPath.length > 0) {
    const currentSlug = _currentPath[0] // The root slug
    const subpageTitle = pageInfo?.title || 'page'
    const subpageSlug = subpageTitle.toLowerCase().replace(/\s+/g, '-')

    // Build hierarchical path: /locale/post/{root-slug}/{hierarchy}-{pageId}
    const pathSegments = [..._currentPath]
    if (pathSegments.length === 1) {
      // Direct subpage of root
      return `/${locale}/post/${currentSlug}/${subpageSlug}-${pageId}`
    } else {
      // Deep nested
      return `/${locale}/post/${currentSlug}/${pathSegments.slice(1).join('/')}/${subpageSlug}-${pageId}`
    }
  }

  // Fallback - direct page access
  return `/${locale}/post/${pageId}`
}

/**
 * Extracts page ID from URL segments
 */
export function extractPageIdFromUrl(segments: string[]): string {
  if (segments.length === 0) return ''

  const lastSegment = segments.at(-1)

  // Handle format: {title}-{pageId} where pageId is a UUID with hyphens
  // UUID format: 8-4-4-4-12 hex digits (36 chars total with hyphens)
  const uuidRegex =
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
  const match = lastSegment?.match(uuidRegex)

  if (match) {
    return match[1]
  }

  return lastSegment || ''
}

/**
 * Builds breadcrumb from URL segments
 */
export function buildBreadcrumb(
  segments: string[],
  siteMap: SiteMap,
  locale: string = localeConfig.defaultLocale
): Array<{ title: string; href: string }> {
  const breadcrumbs = []
  let _currentPath = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    _currentPath += `/${segment}`

    if (i === 0) {
      // Root page
      const pageInfo = Object.values(siteMap.pageInfoMap).find(
        (p) => p.slug === segment
      )
      breadcrumbs.push({
        title: pageInfo?.title || segment,
        href: `/${locale}/post/${segment}`
      })
    } else {
      // Subpage
      const pageId = extractPageIdFromUrl([segment])
      breadcrumbs.push({
        title: segment.replace(`-${pageId}`, ''),
        href: `/${locale}/post/${segments.slice(0, i + 1).join('/')}`
      })
    }
  }

  return breadcrumbs
}
