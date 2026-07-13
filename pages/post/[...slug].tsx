import { GetStaticPaths, GetStaticProps } from 'next'
import * as React from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../../next-i18next.config.cjs'

import { NotionPage } from '@/components/NotionPage'
import type * as types from '@/lib/context/types'
import { serializeSiteMapForPage } from '@/lib/context/client-site-map'
import { getCachedSiteMap } from '@/lib/context/site-cache'
import { getPage } from '@/lib/notion'
import siteConfig from '../../site.config'

export interface NestedPostPageProps {
  site: types.Site
  siteMap: types.SiteMap
  pageId: string
  recordMap?: types.ExtendedRecordMap
  isPrivate?: boolean
}

export default function NestedPostPage({
  site,
  siteMap,
  pageId,
  recordMap,
  isPrivate,
  showTOC
}: NestedPostPageProps & { showTOC?: boolean }) {
  if (isPrivate) {
    return (
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--secondary-text-color)'
        }}
      >
        <h1>Private Page</h1>
        <p>This page is private and cannot be accessed.</p>
      </div>
    )
  }

  const pageProps: types.PageProps = {
    site,
    siteMap,
    pageId,
    recordMap,
    showTOC
  }

  return <NotionPage {...pageProps} />
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const siteMap = await getCachedSiteMap()
    const paths: Array<{ params: { slug: string[] }; locale?: string }> = []

    // Generate paths for root pages only (Post/Home type)
    Object.entries(siteMap.pageInfoMap).forEach(([pageId, pageInfo]) => {
      const page = pageInfo as types.PageInfo

      // Skip pages without required properties
      if (!pageId || !pageInfo.title || !pageInfo.type) {
        return
      }

      // Skip non-public pages
      if (pageInfo.public === false) {
        return
      }

      // 전체 SSG 전환(2026-07-13): subpage 포함 사이트맵의 모든 Post/Home을
      // 빌드 시 생성한다. fallback: false라 빌드에 없는 경로는 404.
      if (page.type === 'Post' || page.type === 'Home') {
        siteConfig.locale.localeList.forEach((locale) => {
          if (page.language === locale) {
            paths.push({
              params: { slug: [page.slug] },
              locale
            })
          }
        })
      }
    })

    return {
      paths,
      fallback: false
    }
  } catch (err) {
    console.error('Error generating nested post paths:', err)
    return {
      paths: [],
      fallback: false
    }
  }
}

export const getStaticProps: GetStaticProps<
  NestedPostPageProps,
  { slug: string[] }
> = async (context) => {
  const { slug } = context.params!
  const locale = context.locale!

  try {
    const siteMap = await getCachedSiteMap()

    // For root pages, find the parent post; for subpages, we'll extract page ID directly
    let parentPostPageId: string | null = null
    let parentPostPageInfo: types.PageInfo | null = null

    if (slug.length === 1) {
      // Only validate parent for root pages
      const parentPostSlug = slug[0]
      for (const [pageId, pageInfo] of Object.entries(siteMap.pageInfoMap)) {
        const page = pageInfo as types.PageInfo
        if (
          page.language === locale &&
          page.slug === parentPostSlug &&
          (page.type === 'Post' || page.type === 'Home')
        ) {
          parentPostPageId = pageId
          parentPostPageInfo = page
          break
        }
      }
    }

    // Extract page ID from URL segments
    let currentPageId: string

    if (slug.length === 1) {
      // Root page: /post/{slug} - must exist in sitemap
      if (!parentPostPageId || !parentPostPageInfo) {
        return {
          notFound: true
        }
      }
      currentPageId = parentPostPageId
    } else {
      // Subpage: /post/{root-slug}/{...}/{title}-{pageId} - extract full UUID
      const lastSegment = slug.at(-1)

      // UUID format: 8-4-4-4-12 hex digits (36 chars total with hyphens)
      const uuidRegex =
        /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
      const match = lastSegment?.match(uuidRegex)

      if (match) {
        currentPageId = match[1]
      } else {
        currentPageId = lastSegment || ''
      }
    }

    // Fetch the page content
    const recordMap = await getPage(currentPageId)

    // Check if the page is private (if we have page info)
    const pageInfo = siteMap.pageInfoMap[currentPageId]
    if (pageInfo?.public === false) {
      return {
        notFound: true
      }
    }

    return {
      props: {
        ...(await serverSideTranslations(
          locale,
          ['common', 'languages'],
          nextI18NextConfig
        )),
        site: siteMap.site,
        siteMap: serializeSiteMapForPage(siteMap, locale),
        pageId: currentPageId,
        recordMap,
        slugPath: slug
      }
    }
  } catch (err) {
    console.error('Error fetching nested post page:', err)
    return {
      notFound: true
    }
  }
}
