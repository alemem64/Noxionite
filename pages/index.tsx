import { type GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../next-i18next.config.cjs'

import type { ExtendedRecordMap, PageProps } from '@/lib/context/types'
import { Home } from '@/components/home/Home'
import { site } from '@/lib/config'
import { getPage } from '@/lib/notion'
import { getCachedSiteMap } from '@/lib/context/site-cache'

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
  const locale = context.locale!

  try {
  
    
    // Get the site map with all pages and navigation tree
    const siteMap = await getCachedSiteMap()
    
    // Find all pages with type 'Home'
    const homePages = []
    for (const pageInfo of Object.values(siteMap.pageInfoMap)) {
      if (pageInfo.type === 'Home') {
        homePages.push(pageInfo)
      }
    }

    // Fetch recordMap for each home page
    const homeRecordMaps: { [pageId: string]: ExtendedRecordMap } = {}
    if (homePages.length > 0) {
      const homePageIds = homePages.map((page) => page.pageId)
      const recordMapPromises = homePageIds.map((id) => getPage(id))
      const recordMaps = await Promise.all(recordMapPromises)
      
      for (const [index, recordMap] of recordMaps.entries()) {
        const pageId = homePageIds[index]
        if (pageId) {
          homeRecordMaps[pageId] = recordMap
        }
      }
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, ['common', 'languages'], nextI18NextConfig)),
        site,
        siteMap,
        pageId: 'home', // Add pageId for TopNav to render
        homeRecordMaps,
        meta: {
          title: site.name,
          description: site.description,
          image: null
        }
      },
      revalidate: site.isr?.revalidate ?? 60
    }
  } catch (err) {
    console.error('Error in getServerSideProps for locale:', locale, err)

    return {
      props: {
        ...(await serverSideTranslations(locale, ['common', 'languages'], nextI18NextConfig)),
        site,
        siteMap: undefined,
        pageId: 'home' // Add pageId for TopNav to render
      },
      revalidate: site.isr?.revalidate ?? 60
    }
  }
}

export default function HomePage(props: PageProps) {
  return <Home {...props} />
}
