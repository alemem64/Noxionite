import { GetStaticPaths, GetStaticProps } from 'next'
import * as React from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../../next-i18next.config.cjs'

import { CategoryPage } from '@/components/CategoryPage'
import type * as types from '@/lib/context/types'
import { getCachedSiteMap } from '@/lib/context/site-cache'
import siteConfig from '../../site.config'

import { site } from '@/lib/config'

export interface CategoryPageProps {
  site: types.Site
  siteMap: types.SiteMap
  pageId: string
  isPrivate?: boolean
}

export default function CategorySlugPage({ site, siteMap, pageId, isPrivate, isMobile }: CategoryPageProps & { isMobile?: boolean }) {
  if (isPrivate) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'var(--secondary-text-color)'
      }}>
        <h1>Private Page</h1>
        <p>This page is private and cannot be accessed.</p>
      </div>
    )
  }

  const pageProps: types.PageProps = {
    site,
    siteMap,
    pageId,
  }

  return <CategoryPage pageProps={pageProps} isMobile={isMobile} />
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const siteMap = await getCachedSiteMap()
    const paths: Array<{ params: { slug: string }; locale?: string }> = []

    // Generate paths for all category pages
    Object.values(siteMap.pageInfoMap).forEach((pageInfo) => {
      const page = pageInfo as types.PageInfo
      if (page.type === 'Category') {
        // Add paths for each locale
        siteConfig.locale.localeList.forEach((locale) => {
          if (page.language === locale) {
            paths.push({
              params: { slug: page.slug },
              locale,
            })
          }
        })
      }
    })

  

    return {
      paths,
      fallback: 'blocking',
    }
  } catch (err) {
    console.error('Error generating category paths:', err)
    return {
      paths: [],
      fallback: 'blocking',
    }
  }
}

export const getStaticProps: GetStaticProps<CategoryPageProps, { slug: string }> = async (context) => {
  const { slug } = context.params!
  const locale = context.locale!

  try {
    const siteMap = await getCachedSiteMap()

    // Find the category page by slug and locale
    let categoryPageId: string | null = null
    let categoryPageInfo: types.PageInfo | null = null

    for (const [pageId, pageInfo] of Object.entries(siteMap.pageInfoMap)) {
      const page = pageInfo as types.PageInfo
      if (page.language === locale && page.slug === slug && page.type === 'Category') {
        categoryPageId = pageId
        categoryPageInfo = page
        break
      }
    }

    if (!categoryPageId || !categoryPageInfo) {
      return {
        notFound: true,
        revalidate: site.isr?.revalidate ?? 60,
      }
    }

    const title = categoryPageInfo.title || `${slug} - ${siteMap.site.name}`
    const description = categoryPageInfo.description || `Posts in category ${slug}`
    const image = categoryPageInfo.coverImage || null

    // Check if the page is private
    if (categoryPageInfo.public === false) {
      return {
        props: {
          ...(await serverSideTranslations(locale, ['common', 'languages'], nextI18NextConfig)),
          site: siteMap.site,
          siteMap,
          pageId: categoryPageId,
          isPrivate: true,
          meta: {
            title,
            description,
            image
          }
        },
        revalidate: site.isr?.revalidate ?? 60,
      }
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, ['common', 'languages'], nextI18NextConfig)),
        site: siteMap.site,
        siteMap,
        pageId: categoryPageId,
        meta: {
          title,
          description,
          image
        }
      },
      revalidate: site.isr?.revalidate ?? 60,
    }
  } catch (err) {
    console.error('Error fetching category page:', err)
    return {
      notFound: true,
      revalidate: site.isr?.revalidate ?? 60,
    }
  }
}

