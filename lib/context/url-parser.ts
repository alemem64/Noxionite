/**
 * URL parsing utilities for graph navigation
 */

// Import locale configuration from site.locale.json
import siteLocale from '../../site.locale.json'

export interface ParsedUrl {
  segment: string
  slug: string
  subpage: string
  isSubpage: boolean
  segments: string[]
  fullPath: string
  isRoot: boolean
  isPost: boolean
  isCategory: boolean
  isTag: boolean
  isAllTags: boolean
  locale?: string
}

const ROUTE_TYPES = new Set(['post', 'category', 'tag', 'all-tags'])
const LOCALE_CODES = new Set(siteLocale.localeList)

/**
 * Parse URL pathname to extract routing information
 */
export function parseUrlPathname(pathname: string): ParsedUrl {
  try {
    pathname = new URL(pathname).pathname
  } catch {
    // Treat non-absolute inputs as pathnames.
  }

  if (!pathname || pathname === '/') {
    return createRootResult()
  }

  // Remove leading/trailing slashes and split
  const segments = pathname
    .replace(/^\/|\/$/g, '')
    .split('/')
    .filter(Boolean)

  if (segments.length === 0) {
    return createRootResult()
  }

  // Handle locale prefix (e.g., /ko/post/slug)
  let locale: string | undefined
  let routeSegments = [...segments]

  if (segments.length > 1 && LOCALE_CODES.has(segments[0])) {
    locale = segments[0]
    routeSegments = segments.slice(1)
  }

  // Find the route type
  const routeTypeIndex = routeSegments.findIndex((segment) =>
    ROUTE_TYPES.has(segment)
  )

  if (routeTypeIndex === -1) {
    return createRootResult()
  }

  const relevantSegments = routeSegments.slice(routeTypeIndex)
  const segment = relevantSegments.at(0) || ''
  const slug = relevantSegments.at(1) || ''
  const subpage = relevantSegments.at(-1) || ''
  const isSubpage = relevantSegments.length > 2

  return {
    segment,
    slug,
    subpage,
    isSubpage,
    segments: relevantSegments,
    fullPath: pathname,
    isRoot: false,
    isPost: segment === 'post',
    isCategory: segment === 'category',
    isTag: segment === 'tag',
    isAllTags: segment === 'all-tags',
    locale
  }
}

function createRootResult(): ParsedUrl {
  return {
    segment: '',
    slug: '',
    subpage: '',
    isSubpage: false,
    segments: [],
    fullPath: '/',
    isRoot: true,
    isPost: false,
    isCategory: false,
    isTag: false,
    isAllTags: false
  }
}
