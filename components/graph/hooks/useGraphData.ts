import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'next-i18next'
import localeConfig from '../../../site.locale.json'
import type { SiteMap } from '@/lib/context/types'
import {
  createPostGraphData,
  createTagGraphData,
  getCachedGraphData,
  invalidateDataCache
} from '../utils/graphDataProcessor'

export const useGraphData = (
  siteMap?: SiteMap,
  locale = localeConfig.defaultLocale
) => {
  const { t } = useTranslation('common')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Memoized post graph data
  const postGraph = useMemo(() => {
    if (!siteMap?.navigationTree) return { nodes: [], links: [] }

    try {
      setIsLoading(true)
      setError(null)

      const cacheKey = `post-graph-${locale}-${siteMap.navigationTree.length}`
      const data = getCachedGraphData(cacheKey, () =>
        createPostGraphData(siteMap, locale)
      )

      setIsLoading(false)
      return data
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to process post graph data')
      )
      setIsLoading(false)
      return { nodes: [], links: [] }
    }
  }, [siteMap, locale])

  // Memoized tag graph data
  const tagGraph = useMemo(() => {
    if (!siteMap?.tagGraphData) return { nodes: [], links: [] }

    try {
      setIsLoading(true)
      setError(null)

      const localeTagData = siteMap.tagGraphData.locales[locale]
      if (!localeTagData) return { nodes: [], links: [] }

      const cacheKey = `tag-graph-${locale}-${Object.keys(localeTagData.tagCounts).length}`
      const data = getCachedGraphData(cacheKey, () =>
        createTagGraphData(localeTagData, t, locale)
      )

      setIsLoading(false)
      return data
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to process tag graph data')
      )
      setIsLoading(false)
      return { nodes: [], links: [] }
    }
  }, [siteMap?.tagGraphData, locale, t])

  // Invalidate cache when siteMap changes significantly
  useEffect(() => {
    const handleInvalidate = () => {
      invalidateDataCache()
    }

    // Listen for site updates (if any)
    window.addEventListener('site-map-updated', handleInvalidate)

    return () => {
      window.removeEventListener('site-map-updated', handleInvalidate)
    }
  }, [])

  // Preload images for better performance
  useEffect(() => {
    const allImageUrls = [
      ...postGraph.nodes.map((n) => n.imageUrl).filter(Boolean),
      ...tagGraph.nodes.map((n) => n.imageUrl).filter(Boolean)
    ] as string[]

    // Preload unique images
    const uniqueUrls = [...new Set(allImageUrls)]
    uniqueUrls.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [postGraph, tagGraph])

  return {
    data: {
      postGraph,
      tagGraph
    },
    isLoading,
    error
  }
}
