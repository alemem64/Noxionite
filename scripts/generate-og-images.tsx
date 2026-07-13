/**
 * 빌드된 HTML(.next/server/pages)에서 각 페이지의 경로를 읽어
 * OG 이미지를 satori로 사전 생성한다 → public/og-images/*.png
 *
 * 디자인은 구 puppeteer 방식의 components/SocialCard.tsx를 그대로 재사용한다
 * (커버 이미지 배경 + breadcrumb + author + tags + 날짜).
 * Cloudflare Workers에는 edge/puppeteer 런타임을 둘 수 없어(OpenNext 제약)
 * 빌드 시 생성으로 전환 (2026-07-13, SocialCard 재사용 2026-07-14).
 *
 * 실행: 빌드 후 자동 (package.json postbuild)
 */
import { Resvg } from '@resvg/resvg-js'
// eslint-disable-next-line unicorn/import-style
import * as React from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pMap from 'p-map'
import satori from 'satori'

import { SocialCard } from '../components/SocialCard'
import { getCachedSiteMap } from '../lib/context/site-cache'
import siteConfig from '../site.config'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAGES_DIR = path.join(ROOT, '.next', 'server', 'pages')
const OUT_DIR = path.join(ROOT, 'public', 'og-images')
const FONT_DIR = path.join(
  ROOT,
  'node_modules',
  '@expo-google-fonts',
  'noto-sans-kr'
)

const size = { width: 1200, height: 630 }

async function loadFonts() {
  const [w400, w700, w900] = await Promise.all([
    fs.readFile(path.join(FONT_DIR, '400Regular', 'NotoSansKR_400Regular.ttf')),
    fs.readFile(path.join(FONT_DIR, '700Bold', 'NotoSansKR_700Bold.ttf')),
    fs.readFile(path.join(FONT_DIR, '900Black', 'NotoSansKR_900Black.ttf'))
  ])
  return [
    {
      name: 'Noto Sans KR',
      data: w400,
      weight: 400 as const,
      style: 'normal' as const
    },
    {
      name: 'Noto Sans KR',
      data: w700,
      weight: 700 as const,
      style: 'normal' as const
    },
    {
      name: 'Noto Sans KR',
      data: w900,
      weight: 900 as const,
      style: 'normal' as const
    }
  ]
}

// 1x1 투명 PNG — 이미지 fetch 실패 시 빈 이미지로 대체해 카드 생성 자체는 계속한다
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

// satori는 이미지 URL마다 fetch를 호출한다 — 같은 이미지(아이콘/아바타/커버) 반복
// 요청을 메모이즈하고, 실패는 투명 PNG로 대체한다.
function installFetchCache() {
  const cache = new Map<string, Promise<ArrayBuffer>>()
  const realFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url
    const isImageGet =
      typeof url === 'string' &&
      url.startsWith('http') &&
      (!init || !init.method || init.method === 'GET')

    if (!isImageGet) return realFetch(input, init)

    if (!cache.has(url)) {
      cache.set(
        url,
        realFetch(url)
          .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.arrayBuffer()
          })
          .catch(() => {
            console.warn(
              `[og-images] image fetch failed, using blank: ${url.slice(0, 120)}`
            )
            return TRANSPARENT_PNG.buffer.slice(
              TRANSPARENT_PNG.byteOffset,
              TRANSPARENT_PNG.byteOffset + TRANSPARENT_PNG.byteLength
            )
          })
      )
    }
    const body = await cache.get(url)!
    return new Response(body!.slice(0), { status: 200 })
  }) as typeof fetch
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
    .replaceAll(/&#x([\dA-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replaceAll(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    )
    .replaceAll('&quot;', '"')
    .replaceAll(/&#39;|&apos;/g, "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
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
  installFetchCache()
  const fonts = await loadFonts()
  const siteMap = await getCachedSiteMap()
  const baseUrl = `https://${siteConfig.domain}`

  const htmlFiles = await collectHtmlFiles(PAGES_DIR)
  if (htmlFiles.length === 0) {
    throw new Error(
      `No built HTML found under ${PAGES_DIR} — run next build first`
    )
  }

  await fs.mkdir(OUT_DIR, { recursive: true })
  const seen = new Set<string>()
  const targets: Array<{ fileName: string; pagePath: string }> = []

  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8')
    const image = extractMeta(html, 'og:image')
    const match = image?.match(/\/og-images\/([^/?"]+\.png)/)
    if (!match || seen.has(match[1])) continue
    seen.add(match[1])

    const ogUrl = extractMeta(html, 'og:url') || '/'
    let pagePath = '/'
    try {
      pagePath = new URL(ogUrl, baseUrl).pathname
    } catch {
      /* 기본값 유지 */
    }
    targets.push({ fileName: match[1], pagePath })
  }

  let failures = 0
  await pMap(
    targets,
    async ({ fileName, pagePath }) => {
      try {
        const svg = await satori(
          <SocialCard
            url={pagePath}
            siteMap={siteMap}
            baseUrl={baseUrl}
            disableGlobalStyles
          />,
          { ...size, fonts }
        )
        const png = new Resvg(svg, {
          fitTo: { mode: 'width', value: size.width }
        })
          .render()
          .asPng()
        await fs.writeFile(path.join(OUT_DIR, fileName), png)
      } catch (err) {
        failures++
        console.error(`[og-images] failed for ${pagePath}:`, err)
      }
    },
    { concurrency: 4 }
  )

  console.log(
    `[og-images] generated ${targets.length - failures}/${targets.length} images → public/og-images`
  )
  if (failures > 0) {
    throw new Error(`[og-images] ${failures} images failed`)
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await -- tsconfig target이 TLA를 지원하지 않는다
void main().catch((err: unknown) => {
  console.error('[og-images] failed:', err)
  process.exitCode = 1
})
