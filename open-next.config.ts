// Cloudflare Workers 배포 (Vercel에서 이전, 2026-07-13)
// 전 페이지가 빌드 시 SSG(fallback: false, revalidate 없음)이므로
// 프리렌더 산출물을 정적 자산에서 읽기만 하는 캐시를 쓴다 — 런타임 재렌더 방지.
import { defineCloudflareConfig } from '@opennextjs/cloudflare'
// @ts-ignore — tsconfig moduleResolution:node가 package exports 서브패스 타입을 못 찾는다 (런타임 해석은 정상)
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache
})
