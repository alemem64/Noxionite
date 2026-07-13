/**
 * 빌드된 HTML(.next/server/pages)에서 각 페이지의 og 메타를 읽어
 * OG 이미지를 satori로 사전 생성한다 → public/og-images/*.png
 *
 * 디자인은 구 pages/api/og.tsx(next/og ImageResponse)를 그대로 이식했다.
 * Cloudflare Workers에는 edge runtime API route를 둘 수 없어(OpenNext 제약)
 * 런타임 생성 대신 빌드 시 생성으로 전환 (2026-07-13).
 *
 * 실행: 빌드 후 자동 (package.json postbuild)
 */
import { Resvg } from '@resvg/resvg-js'
// eslint-disable-next-line unicorn/import-style
import * as React from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'

import siteConfig from '../site.config'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAGES_DIR = path.join(ROOT, '.next', 'server', 'pages')
const OUT_DIR = path.join(ROOT, 'public', 'og-images')

const size = { width: 1200, height: 630 }

const FONT_DIR = path.join(
  ROOT,
  'node_modules',
  '@fontsource',
  'noto-sans-kr',
  'files'
)

async function loadFonts() {
  // fontsource 파일명이 버전에 따라 다르므로 디렉토리에서 직접 찾는다
  const files = await fs.readdir(FONT_DIR)
  const pick = (weight: number) => {
    const name = files.find(
      (f) => f.includes(`-${weight}-normal.woff`) && !f.endsWith('.woff2')
    )
    return name ? fs.readFile(path.join(FONT_DIR, name)) : null
  }
  const [w400, w700, w900] = await Promise.all([
    pick(400),
    pick(700),
    pick(900)
  ])
  const fonts = []
  if (w400)
    fonts.push({
      name: 'Noto Sans KR',
      data: w400,
      weight: 400 as const,
      style: 'normal' as const
    })
  if (w700)
    fonts.push({
      name: 'Noto Sans KR',
      data: w700,
      weight: 700 as const,
      style: 'normal' as const
    })
  if (w900)
    fonts.push({
      name: 'Noto Sans KR',
      data: w900,
      weight: 900 as const,
      style: 'normal' as const
    })
  if (fonts.length === 0)
    throw new Error(`No usable .woff fonts found in ${FONT_DIR}`)
  return fonts
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

function OgCard({
  title,
  description,
  pathLabel,
  type
}: {
  title: string
  description: string
  pathLabel: string
  type: string
}) {
  return (
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
        fontFamily: 'Noto Sans KR',
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
        <span>{pathLabel}</span>
      </div>
    </div>
  )
}

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await collectHtmlFiles(full)))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([\dA-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`),
    new RegExp(`<meta[^>]*content="([^"]*)"[^>]*property="${property}"`)
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return decodeHtmlEntities(m[1])
  }
  return undefined
}

async function main() {
  const fonts = await loadFonts()
  const htmlFiles = await collectHtmlFiles(PAGES_DIR)
  if (htmlFiles.length === 0) {
    throw new Error(
      `No built HTML found under ${PAGES_DIR} — run next build first`
    )
  }

  await fs.mkdir(OUT_DIR, { recursive: true })
  const generated = new Set<string>()
  let count = 0

  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8')
    const image = extractMeta(html, 'og:image')
    if (!image) continue
    const match = image.match(/\/og-images\/([^/?"]+\.png)/)
    if (!match) continue
    const fileName = match[1]
    if (generated.has(fileName)) continue
    generated.add(fileName)

    const title = clampText(
      extractMeta(html, 'og:title') || siteConfig.name,
      90
    )
    const description = clampText(
      extractMeta(html, 'og:description') ||
        siteConfig.description ||
        'Notion-powered blog',
      150
    )
    const ogType =
      extractMeta(html, 'og:type') === 'article' ? 'Article' : 'Website'
    const ogUrl = extractMeta(html, 'og:url') || '/'
    let pathLabel = '/'
    try {
      pathLabel = clampText(
        new URL(ogUrl, `https://${siteConfig.domain}`).pathname,
        80
      )
    } catch {
      /* 기본값 유지 */
    }

    const svg = await satori(
      <OgCard
        title={title}
        description={description}
        pathLabel={pathLabel}
        type={ogType}
      />,
      { ...size, fonts }
    )
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size.width } })
      .render()
      .asPng()
    await fs.writeFile(path.join(OUT_DIR, fileName), png)
    count++
  }

  console.log(`[og-images] generated ${count} images → public/og-images`)
}

await main()
