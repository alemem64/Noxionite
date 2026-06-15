import { parseUrlPathname } from './context/url-parser'
import siteLocale from '../site.locale.json'

export function getSocialImageUrl(url: string): string | null {
  try {
    // Parse URL to extract routing information
    const parsedUrl = parseUrlPathname(url)

    const locale = parsedUrl.locale || siteLocale.defaultLocale

    let folder: string
    let targetSlug: string

    // Determine folder and target slug based on parsed URL
    if (parsedUrl.isRoot) {
      folder = 'root'
      targetSlug = 'root'
    } else if (parsedUrl.isPost) {
      folder = 'post'
      targetSlug = parsedUrl.isSubpage ? parsedUrl.subpage : parsedUrl.slug
    } else if (parsedUrl.isCategory) {
      folder = 'category'
      targetSlug = parsedUrl.slug
    } else if (parsedUrl.isAllTags) {
      folder = 'all-tags'
      targetSlug = 'all-tags'
    } else if (parsedUrl.isTag) {
      folder = 'tag'
      targetSlug = encodeURIComponent(parsedUrl.slug)
    } else {
      folder = 'root'
      targetSlug = 'root'
    }

    // For subpages, always use on-demand generation via API
    if (parsedUrl.isSubpage) {
      return `/api/generate-social-image?path=${encodeURIComponent(url)}`
    }

    // For regular pages, check if static image exists
    // Special handling for all-tags to use direct filename instead of subdirectory
    const specificImagePath =
      folder === 'all-tags'
        ? `/social-images/${locale}/${targetSlug}.jpg`
        : `/social-images/${locale}/${folder}/${targetSlug}.jpg`

    // For root pages, use the locale-independent path
    if (folder === 'root') {
      return `/social-images/root.jpg`
    }

    // Return the specific image path for regular pages

    return specificImagePath
  } catch (err) {
    console.error('[getSocialImageUrl] Error:', err)
    // Return root as fallback using locale-independent path
    return `/social-images/root.jpg`
  }
}
