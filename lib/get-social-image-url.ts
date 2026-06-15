import * as config from './config'

export interface SocialImageUrlOptions {
  title?: string | null
  description?: string | null
  type?: 'article' | 'website'
}

export function getSocialImageUrl(
  url: string,
  options: SocialImageUrlOptions = {}
): string {
  const params = new URLSearchParams()

  params.set('path', normalizePath(url))
  params.set('title', normalizeText(options.title) || config.name)
  params.set(
    'description',
    normalizeText(options.description) || config.description
  )
  params.set(
    'type',
    options.type || (url.includes('/post/') ? 'article' : 'website')
  )

  return `/api/og?${params.toString()}`
}

function normalizePath(url: string): string {
  try {
    const parsedUrl = new URL(url, config.host)
    return `${parsedUrl.pathname}${parsedUrl.search}`
  } catch {
    return url || '/'
  }
}

function normalizeText(value?: string | null): string {
  return (value || '').replace(/\s+/g, ' ').trim().slice(0, 180)
}
