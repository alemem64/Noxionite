import ky from 'ky'
import {
  type ExtendedRecordMap,
  type PreviewImage,
  type PreviewImageMap
} from 'notion-types'
import { getPageImageUrls, normalizeUrl } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import { defaultPageCover, defaultPageIcon } from './config'
import { db } from './db'
import { mapImageUrl } from './map-image-url'

export async function getPreviewImageMap(
  recordMap: ExtendedRecordMap
): Promise<PreviewImageMap> {
  const urls: string[] = getPageImageUrls(recordMap, {
    mapImageUrl
  })
    .concat([defaultPageIcon, defaultPageCover].filter(Boolean) as string[])
    .filter(Boolean)

  const previewImagesMap = Object.fromEntries(
    await pMap(
      urls,
      async (url) => {
        const cacheKey = normalizeUrl(url)
        return [cacheKey, await getPreviewImage(url, { cacheKey })]
      },
      {
        concurrency: 8
      }
    )
  )

  return previewImagesMap
}

async function createPreviewImage(
  url: string,
  { cacheKey }: { cacheKey: string }
): Promise<PreviewImage | null> {
  try {
    try {
      const cachedPreviewImage = await db.get(cacheKey)
      if (cachedPreviewImage) {
        return cachedPreviewImage
      }
    } catch (err: any) {
      // ignore redis errors
      console.warn(`redis error get "${cacheKey}"`, err.message)
    }

    const body = await ky(url).arrayBuffer()
    // sharp 네이티브 모듈은 workerd에서 로드 불가 — 빌드(SSG) 시에만 lazy 로드한다 (2026-07-13)
    const { default: lqip } = await import('lqip-modern')
    const result = await lqip(body)

    const previewImage = {
      originalWidth: result.metadata.originalWidth,
      originalHeight: result.metadata.originalHeight,
      dataURIBase64: result.metadata.dataURIBase64
    }

    try {
      await db.set(cacheKey, previewImage)
    } catch (err: any) {
      // ignore redis errors
      console.warn(`redis error set "${cacheKey}"`, err.message)
    }

    return previewImage
  } catch (err: any) {
    console.warn('failed to create preview image', url, err.message)
    return null
  }
}

export const getPreviewImage = pMemoize(createPreviewImage)
