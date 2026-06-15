/**
 * Site-wide app configuration.
 *
 * This file pulls from the root "site.config.ts" as well as environment variables
 * for optional depenencies.
 */
import { parsePageId } from 'notion-utils'
import { type PostHogConfig } from 'posthog-js'
import locale from '../site.locale.json'

import {
  getEnv,
  getRequiredSiteConfig,
  getSiteConfig
} from './get-config-value'
import { type NavigationLink } from './site-config'
import {
  type NavigationStyle,
  type PageUrlOverridesInverseMap,
  type PageUrlOverridesMap,
  type Site
} from './context/types'

export const rootNotionPageId: string | null =
  parsePageId(getSiteConfig('rootNotionPageId', ''), { uuid: false }) || null

// if you want to restrict pages to a single notion workspace (optional)
export const rootNotionSpaceId: string | null =
  parsePageId(getSiteConfig('rootNotionSpaceId'), { uuid: true }) ?? null

export const pageUrlOverrides = cleanPageUrlMap(
  getSiteConfig('pageUrlOverrides', {}) || {},
  { label: 'pageUrlOverrides' }
)

export const pageUrlAdditions = cleanPageUrlMap(
  getSiteConfig('pageUrlAdditions', {}) || {},
  { label: 'pageUrlAdditions' }
)

export const inversePageUrlOverrides = invertPageUrlOverrides(pageUrlOverrides)

export const environment = process.env.NODE_ENV || 'development'
export const isDev = environment === 'development'

// general site config
export const name: string = getRequiredSiteConfig('name')
export const author: string = getRequiredSiteConfig('author')
export const domain: string = getRequiredSiteConfig('domain')
export const description: string = getSiteConfig('description', 'Notion Blog')
export const dnsRecord: string = getSiteConfig('dnsRecord', '')

export const language: string = getSiteConfig('language', locale.defaultLocale)

// social accounts
export const socials: Record<string, string> = getSiteConfig('socials', {})

export const getMastodonHandle = (): string | undefined => {
  if (!socials.mastodon) {
    return
  }

  try {
    const url = new URL(socials.mastodon)
    // Since Mastodon is decentralized, handles include the instance domain name.
    // e.g. @example@mastodon.social
    return `${url.pathname.slice(1)}@${url.hostname}`
  } catch {
    // ignore invalid urls
    return
  }
}

// default notion values for site-wide consistency (optional; may be overridden on a per-page basis)
export const defaultPageIcon: string | undefined =
  getSiteConfig('defaultPageIcon')
export const defaultPageCover: string | undefined =
  getSiteConfig('defaultPageCover')
export const defaultPageCoverPosition: number = getSiteConfig(
  'defaultPageCoverPosition',
  0.5
)

// Optional whether or not to enable support for LQIP preview images
export const isPreviewImageSupportEnabled: boolean = getSiteConfig(
  'isPreviewImageSupportEnabled',
  false
)

// Optional whether or not to include the Notion ID in page URLs or just use slugs
export const includeNotionIdInUrls: boolean = getSiteConfig(
  'includeNotionIdInUrls',
  !!isDev
)

export const notionDbIds: string[] = getSiteConfig('notionDbIds', [])

export const navigationStyle: NavigationStyle = getSiteConfig(
  'navigationStyle',
  'default'
)

export const navigationLinks: Array<NavigationLink | undefined> = getSiteConfig(
  'navigationLinks',
  null
)

// Optional site search
export const isSearchEnabled: boolean = getSiteConfig('isSearchEnabled', true)

// ----------------------------------------------------------------------------

// Optional redis instance for persisting preview images
export const isRedisEnabled: boolean =
  getSiteConfig('isRedisEnabled', false) || !!getEnv('REDIS_ENABLED', null)

// (if you want to enable redis, only REDIS_HOST and REDIS_PASSWORD are required)
// we recommend that you store these in a local `.env` file
export const redisHost = getEnv('REDIS_HOST', isRedisEnabled ? undefined : null)
export const redisPassword = getEnv(
  'REDIS_PASSWORD',
  isRedisEnabled ? undefined : null
)
export const redisUser: string = getEnv('REDIS_USER', 'default')
export const redisUrl = getEnv(
  'REDIS_URL',
  isRedisEnabled ? `redis://${redisUser}:${redisPassword}@${redisHost}` : null
)
export const redisNamespace = getEnv('REDIS_NAMESPACE', 'preview-images')

// ----------------------------------------------------------------------------

export const isServer = typeof window === 'undefined'

export const port = getEnv('PORT', '3000')
export const host = isDev ? `http://localhost:${port}` : `https://${domain}`
export const apiHost = isDev
  ? host
  : `https://${process.env.VERCEL_URL || domain}`

export const apiBaseUrl = `/api`

export const api = {
  searchNotion: `${apiBaseUrl}/search-notion`,
  getNotionPageInfo: `${apiBaseUrl}/notion-page-info`,
  getSocialImage: `${apiBaseUrl}/social-image`
}

// ----------------------------------------------------------------------------

export const site: Site = {
  domain,
  name,
  rootNotionPageId,
  rootNotionSpaceId,
  description,
  isr: getSiteConfig('isr')
}

export const fathomId = isDev ? undefined : process.env.NEXT_PUBLIC_FATHOM_ID
export const fathomConfig = fathomId
  ? {
      excludedDomains: ['localhost', 'localhost:3000']
    }
  : undefined

export const posthogId = process.env.NEXT_PUBLIC_POSTHOG_ID
export const posthogConfig: Partial<PostHogConfig> = {
  api_host: 'https://app.posthog.com'
}

function cleanPageUrlMap(
  pageUrlMap: PageUrlOverridesMap,
  {
    label
  }: {
    label: string
  }
): PageUrlOverridesMap {
  return Object.keys(pageUrlMap).reduce((acc, uri) => {
    const pageId = pageUrlMap[uri]
    const uuid = parsePageId(pageId, { uuid: false })

    if (!uuid) {
      throw new Error(`Invalid ${label} page id "${pageId}"`)
    }

    if (!uri) {
      throw new Error(`Missing ${label} value for page "${pageId}"`)
    }

    if (!uri.startsWith('/')) {
      throw new Error(
        `Invalid ${label} value for page "${pageId}": value "${uri}" should be a relative URI that starts with "/"`
      )
    }

    const path = uri.slice(1)

    return {
      ...acc,
      [path]: uuid
    }
  }, {})
}

function invertPageUrlOverrides(
  pageUrlOverrides: PageUrlOverridesMap
): PageUrlOverridesInverseMap {
  return Object.keys(pageUrlOverrides).reduce((acc, uri) => {
    const pageId = pageUrlOverrides[uri]!

    return {
      ...acc,
      [pageId]: uri
    }
  }, {})
}
