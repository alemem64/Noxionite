import * as config from './config'

export interface SocialImageUrlOptions {
  title?: string | null
  description?: string | null
  type?: 'article' | 'website'
}

// OG 이미지는 빌드 시 scripts/generate-og-images.tsx가 사전 생성한다
// (Cloudflare Workers 이전으로 런타임 /api/og 제거, 2026-07-13).
// 파일명은 경로만으로 결정되므로 클라이언트/서버/빌드 스크립트가 항상 같은 URL을 만든다.
export function getSocialImageUrl(
  url: string,
  _options: SocialImageUrlOptions = {}
): string {
  return `/og-images/${ogImageFileKey(url)}.png`
}

export function ogImageFileKey(url: string): string {
  const normalized = normalizePath(url)
  const safe =
    normalized
      .replace(/[^\dA-Za-z-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'root'
  return `${safe}-${djb2Hex(normalized)}`
}

export function normalizePath(url: string): string {
  try {
    const parsedUrl = new URL(url, config.host)
    return `${parsedUrl.pathname}${parsedUrl.search}`
  } catch {
    return url || '/'
  }
}

function djb2Hex(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + (value.codePointAt(i) ?? 0)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
