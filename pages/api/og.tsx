import { ImageResponse } from 'next/og'

import siteConfig from '../../site.config'

export const config = {
  runtime: 'edge'
}

const size = {
  width: 1200,
  height: 630
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export default function handler(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = clampText(searchParams.get('title') || siteConfig.name, 90)
  const description = clampText(
    searchParams.get('description') ||
      siteConfig.description ||
      'Notion-powered blog',
    150
  )
  const path = clampText(searchParams.get('path') || '/', 80)
  const type = searchParams.get('type') === 'article' ? 'Article' : 'Website'

  return new ImageResponse(
    (
      <div
        style={{
          ...size,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background:
            'linear-gradient(135deg, #111827 0%, #164e63 46%, #f8fafc 100%)',
          color: '#f8fafc',
          fontFamily,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.46))'
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              fontSize: 30,
              fontWeight: 800
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: '#f8fafc',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 900
              }}
            >
              {siteConfig.name.slice(0, 1).toUpperCase()}
            </div>
            <span>{siteConfig.name}</span>
          </div>

          <div
            style={{
              border: '1px solid rgba(248, 250, 252, 0.42)',
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 24,
              fontWeight: 700,
              color: '#dbeafe'
            }}
          >
            {type}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            maxWidth: 930,
            position: 'relative',
            zIndex: 1
          }}
        >
          <div
            style={{
              fontSize: getTitleFontSize(title),
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: 0
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.34,
              color: '#dbeafe',
              maxWidth: 880
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
            color: '#cbd5e1',
            fontSize: 24,
            fontWeight: 650
          }}
        >
          <span>{siteConfig.domain}</span>
          <span>{path}</span>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    }
  )
}

function clampText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}...`
    : normalized
}

function getTitleFontSize(title: string): number {
  if (title.length <= 18) return 82
  if (title.length <= 34) return 68
  if (title.length <= 52) return 56
  return 48
}
