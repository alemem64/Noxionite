import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getBlockValue } from 'notion-utils'

import styles from 'styles/components/home.module.css'
import localeConfig from '../../site.locale.json'

import type { PageInfo, PageProps } from '@/lib/context/types'

import { NotionPage } from '../../components/NotionPage'
import { UnifiedGraphView } from '../graph/UnifiedGraphView'
import Hero from './Hero'
import HomeNav from './HomeNav'
import RecentPosts from './RecentPosts'
import { TagList } from '../TagList'

export function Home({
  setBackgroundAsset,
  isHeroPaused,
  setIsHeroPaused,
  site,
  siteMap,
  homeRecordMaps,
  isMobile
}: PageProps) {
  const router = useRouter()
  const currentLocale = router.locale || localeConfig.defaultLocale

  const [screenWidth, setScreenWidth] = useState(0)

  const homePages = useMemo(() => {
    if (!siteMap) return []
    return Object.values(siteMap.pageInfoMap).filter(
      (page: PageInfo) =>
        page.type === 'Home' && page.language === currentLocale
    )
  }, [siteMap, currentLocale])

  const getInitialTab = () => {
    if (homePages.length > 0 && homePages[0]) {
      return {
        tab: homePages[0].title,
        pageId: homePages[0].pageId
      }
    }
    return {
      tab: 'recentPosts',
      pageId: null
    }
  }

  const [activeTab, setActiveTab] = useState<string>(getInitialTab().tab)
  const [activeNotionPageId, setActiveNotionPageId] = useState<string | null>(
    getInitialTab().pageId
  )

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle locale changes and sync active tab with displayed content
  useEffect(() => {
    if (activeNotionPageId && siteMap) {
      // Find current page info
      const currentPageInfo = siteMap.pageInfoMap[activeNotionPageId]
      if (currentPageInfo && currentPageInfo.type === 'Home') {
        // Look for equivalent page in new locale with same slug
        const equivalentPage = Object.values(siteMap.pageInfoMap).find(
          (page: PageInfo) =>
            page.type === 'Home' &&
            page.language === currentLocale &&
            page.slug === currentPageInfo.slug
        )

        if (equivalentPage) {
          // Found equivalent page, switch to it
          setActiveTab(equivalentPage.pageId)
          setActiveNotionPageId(equivalentPage.pageId)
        } else {
          // No equivalent page found, switch to first home page in new locale
          const firstHomePage = homePages[0]
          if (firstHomePage) {
            setActiveTab(firstHomePage.pageId)
            setActiveNotionPageId(firstHomePage.pageId)
          } else {
            // Fallback to recentPosts if no home pages available
            setActiveTab('recentPosts')
            setActiveNotionPageId(null)
          }
        }
      }
    }
  }, [currentLocale, siteMap, activeNotionPageId, homePages])

  // Sync active tab with displayed Notion page
  useEffect(() => {
    if (activeNotionPageId && siteMap) {
      const currentPageInfo = siteMap.pageInfoMap[activeNotionPageId]
      if (currentPageInfo && currentPageInfo.type === 'Home') {
        setActiveTab(activeNotionPageId)
      }
    }
  }, [activeNotionPageId, siteMap])

  const showTOC = useMemo(() => {
    if (!activeNotionPageId || !homeRecordMaps?.[activeNotionPageId])
      return false

    const recordMap = homeRecordMaps[activeNotionPageId]
    const pageInfo = siteMap ? siteMap.pageInfoMap[activeNotionPageId] : null

    if (!pageInfo || !recordMap) return false

    const isBlogPost = pageInfo.type === 'Home' || pageInfo.type === 'Post'
    if (!isBlogPost) return false

    let headerCount = 0
    for (const blockWrapper of Object.values(recordMap.block)) {
      const blockData = getBlockValue(blockWrapper)
      if (
        blockData?.type === 'header' ||
        blockData?.type === 'sub_header' ||
        blockData?.type === 'sub_sub_header'
      ) {
        headerCount++
      }
    }

    const minTableOfContentsItems = 3
    return (
      headerCount >= minTableOfContentsItems && !isMobile && screenWidth >= 1200
    )
  }, [activeNotionPageId, homeRecordMaps, siteMap, isMobile, screenWidth])

  const handleNavClick = (tab: string, pageId?: string) => {
    // If clicking the same active item, handle routing
    if (tab === activeTab) {
      if (pageId && siteMap) {
        // Notion page case - route to /{locale}/post/{slug}
        const pageInfo = siteMap.pageInfoMap[pageId]
        if (pageInfo) {
          const locale = currentLocale
          const slug = pageInfo.slug
          const url = `/${locale}/post/${slug}`
          void router.push(url)
        }
      } else if (tab === 'allTags') {
        // All tags case - route to /{locale}/all-tags
        const locale = currentLocale
        const url = `/${locale}/all-tags`
        void router.push(url)
      }
    } else {
      // Normal navigation - just set active state
      setActiveTab(tab)
      if (pageId) {
        setActiveNotionPageId(pageId)
      } else {
        setActiveNotionPageId(null)
      }
    }
  }

  const isNotionPageActive =
    activeNotionPageId && homeRecordMaps?.[activeNotionPageId]

  const homeNotionPaddingRight = showTOC && !isMobile ? '32rem' : '0'

  const activePageInfo =
    activeNotionPageId && siteMap
      ? siteMap.pageInfoMap[activeNotionPageId]
      : null

  const renderTabs = () => {
    switch (activeTab) {
      case 'recentPosts':
        return <RecentPosts siteMap={siteMap} isMobile={isMobile} />
      case 'graphView':
        return <UnifiedGraphView siteMap={siteMap} viewType='home' />
      case 'allTags':
        return <TagList />
      default:
        return <RecentPosts siteMap={siteMap} />
    }
  }

  if (!site || !siteMap) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className={styles.homeContainer}>
        <Hero
          onAssetChange={setBackgroundAsset || (() => {})}
          isPaused={isHeroPaused || false}
          setIsPaused={setIsHeroPaused || (() => {})}
        />
        <HomeNav
          homePages={homePages}
          activeTab={activeTab}
          onNavClick={handleNavClick}
        />

        {/* Render non-Notion tabs inside the main content area */}
        {!isNotionPageActive && (
          <main className={styles.mainContent}>{renderTabs()}</main>
        )}
      </div>

      {/* Render NotionPage outside the main container but with the same padding */}
      {isNotionPageActive && (
        <div
          className={styles.homeNotionContainer}
          style={{ paddingRight: homeNotionPaddingRight }}
          data-is-home='true'
        >
          <NotionPage
            site={site}
            siteMap={siteMap}
            recordMap={homeRecordMaps[activeNotionPageId]}
            pageId={activeNotionPageId}
            isMobile={isMobile}
            hideCoverImage={true}
            parentSlug={activePageInfo?.slug}
            showTOC={showTOC}
          />
        </div>
      )}
    </>
  )
}
