import { IoMoonSharp, IoSunnyOutline, IoMenuOutline } from 'react-icons/io5'
import { useRouter } from 'next/router'

import React from 'react'


import type * as types from '@/lib/context/types'
import { isSearchEnabled } from '@/lib/config'
import { useTranslation } from 'next-i18next'

import { useDarkMode } from '@/lib/use-dark-mode'
import { getBlockTitle, getBlockValue } from 'notion-utils'

import siteConfig from '../site.config'
import siteLocaleConfig from '../site.locale.json'
import { LanguageSwitcher } from './LanguageSwitcher'
import { PageSocial } from './PageSocial'
import { SearchModal } from './SearchModal'
import { Breadcrumb } from './Breadcrumb'

function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <button
      className="glass-item"
      onClick={toggleDarkMode}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ opacity: hasMounted ? 1 : 0 }}
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </button>
  )
}

function MobileMenuButton({ onToggle }: { onToggle: () => void }) {
  return (
    <button className="glass-item" onClick={onToggle} title="Toggle menu">
      <IoMenuOutline />
    </button>
  )
}

interface BreadcrumbItem {
  title: string
  pageInfo?: types.PageInfo
  href?: string
}


function buildPagePathFromHierarchy(
  pageId: string,
  pageInfoMap: Record<string, types.PageInfo>
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = []
  const visited = new Set<string>()
  
  let current = pageInfoMap[pageId]
  if (!current) return path

  // Build path from current page up through parent structure
  const pagePath: types.PageInfo[] = []
  
  while (current && !visited.has(current.pageId)) {
    visited.add(current.pageId)
    pagePath.unshift(current)
    
    // Move to parent page
    if (current.parentPageId && pageInfoMap[current.parentPageId]) {
      current = pageInfoMap[current.parentPageId]
    } else {
      break
    }
  }

  // Convert to breadcrumb items
  for (const page of pagePath) {
    const href =
      page.type === 'Post' || page.type === 'Home'
        ? `/post/${page.slug}`
        : page.type === 'Category'
        ? `/category/${page.slug}`
        : `/${page.slug}`

    path.push({
      title: page.title || 'Untitled',
      pageInfo: page,
      href
    })
  }

  return path
}

function buildBreadcrumbsFromUrl(
  asPath: string,
  pathname: string,
  breadcrumbs: BreadcrumbItem[],
  siteMap: types.SiteMap,
  recordMap?: types.ExtendedRecordMap,
  _locale?: string
): BreadcrumbItem[] {
  const pathSegments = asPath.split('/').filter(Boolean)
  
  // Handle category pages
    if (pathname.startsWith('/category/')) {
      const categorySlug = pathSegments.at(-1)
      if (categorySlug) {
        // Find database by slug using new databaseInfoMap structure with locale key
        const dbEntry = Object.values(siteMap.databaseInfoMap || {}).find(
          db => db.slug === categorySlug
        )
        
        if (dbEntry) {
          // For database category pages, show: site name → database name
          breadcrumbs.push({
            title: dbEntry.name,
            pageInfo: {
              pageId: dbEntry.id,
              title: dbEntry.name,
              type: 'Category',
              slug: dbEntry.slug
            } as types.PageInfo,
            href: `/category/${categorySlug}`
          })
        } else {
          // Find regular category page
          const categoryPage = Object.values(siteMap.pageInfoMap).find(
            p => p.slug === categorySlug && p.type === 'Category'
          )
          if (categoryPage) {
            breadcrumbs.push(...buildPagePathFromHierarchy(categoryPage.pageId, siteMap.pageInfoMap))
          }
        }
      }
      return breadcrumbs
    }
  
  // Handle post pages
  const postIndex = pathSegments.indexOf('post')
  if (postIndex !== -1) {
    const postSegments = pathSegments.slice(postIndex + 1)
    let currentPath = '/post'
    let isFirst = true
    
    for (const segment of postSegments) {
      currentPath += `/${segment}`
      
      let pageInfo: types.PageInfo | undefined
      let title: string
      
      if (isFirst) {
        // Root page - find by slug
        pageInfo = Object.values(siteMap.pageInfoMap).find(p => p.slug === segment)
        title = pageInfo?.title || 'Untitled'
        isFirst = false
      } else {
        // Subpage - extract page ID and get actual title from recordMap
        let extractedPageId: string
        
        if (segment.includes('-')) {
          // Extract full UUID using regex
          const uuidRegex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
          const match = segment.match(uuidRegex)
          if (match) {
            extractedPageId = match[1]
            
            // Try to get title from recordMap first, then fallback to siteMap
            const block = getBlockValue(recordMap?.block?.[extractedPageId])
            title = (block && recordMap ? getBlockTitle(block, recordMap) : undefined) || 
                   siteMap.pageInfoMap[extractedPageId]?.title || 
                   'Untitled'
          } else {
            extractedPageId = segment
            const block = getBlockValue(recordMap?.block?.[extractedPageId])
            title = (block && recordMap ? getBlockTitle(block, recordMap) : undefined) || 
                   siteMap.pageInfoMap[extractedPageId]?.title || 
                   'Untitled'
          }
        } else {
          extractedPageId = segment
          const block = getBlockValue(recordMap?.block?.[extractedPageId])
          title = (block && recordMap ? getBlockTitle(block, recordMap) : undefined) || 
                 siteMap.pageInfoMap[extractedPageId]?.title || 
                 'Untitled'
        }
      }
      
      breadcrumbs.push({
        title,
        pageInfo: pageInfo || { pageId: segment, title } as types.PageInfo,
        href: currentPath
      })
    }
  }
  
  return breadcrumbs
}

interface TopNavProps {
  pageProps: types.PageProps
  isMobile?: boolean
  isSideNavCollapsed?: boolean
  onToggleMobileMenu?: () => void
}

export const TopNav: React.FC<TopNavProps> = ({
  pageProps,
  isMobile,
  isSideNavCollapsed,
  onToggleMobileMenu
}) => {
  const router = useRouter()
  const { siteMap, pageId, recordMap } = pageProps
  const { t } = useTranslation('common')

  const breadcrumbs = React.useMemo((): BreadcrumbItem[] => {
    const { pathname, query, asPath } = router

    const breadcrumbs: BreadcrumbItem[] = [
      {
        title: siteConfig.name,
        href: '/'
      }
    ]



    // Handle 404 page
    if (pathname === '/404') {
      return [
        ...breadcrumbs,
        {
          title: '404',
          href: '/404'
        }
      ]
    }

    // If we're on the root page, just return the base breadcrumb
    if (pathname === '/') {
      return breadcrumbs
    }

    // Build hierarchical breadcrumbs from navigation tree and current page
    if (!siteMap) {
      return breadcrumbs
    }

    if (!pageId) {
      // Handle /all-tags page
      if (pathname === '/all-tags') {
        return [
          ...breadcrumbs,
          {
            title: t('allTags'),
            href: '/all-tags'
          }
        ]
      }

      // Handle tag pages
      if (pathname.startsWith('/tag/')) {
        const tag = query.tag as string
        if (tag) {
          return [
            ...breadcrumbs,
            {
              title: t('allTags'),
              href: '/all-tags'
            },
            {
              title: `#${tag}`,
              pageInfo: {
                pageId: `tag-${tag}`,
                title: `#${tag}`
              } as types.PageInfo,
              href: `/tag/${tag}`
            }
          ]
        }
      }

      return breadcrumbs
    }

    // Build breadcrumbs including database structure
    const pageInfo = siteMap.pageInfoMap[pageId]
    
    if (!pageInfo) {
      // Fallback: Build from URL structure
      return buildBreadcrumbsFromUrl(asPath, pathname, breadcrumbs, siteMap, recordMap, router.locale)
    }

    // Build complete breadcrumb path including database
    const completeBreadcrumbs = [...breadcrumbs]
    

    
    // Check if this page belongs to a database
    const locale = router.locale || siteLocaleConfig.defaultLocale
    const dbKey = `${pageInfo.parentDbId}_${locale}`
    const dbInfo = pageInfo.parentDbId ? siteMap.databaseInfoMap?.[dbKey] : null
    
    if (dbInfo) {

      completeBreadcrumbs.push({
        title: dbInfo.name,
        pageInfo: {
          pageId: dbInfo.id,
          title: dbInfo.name,
          type: 'Category',
          slug: dbInfo.slug
        } as types.PageInfo,
        href: `/category/${dbInfo.slug}`
      })
    }

    // Build hierarchical path from current page up through parent structure
    const pagePath = buildPagePathFromHierarchy(pageId, siteMap.pageInfoMap)
    completeBreadcrumbs.push(...pagePath)
    return completeBreadcrumbs
  }, [siteMap, pageId, router, recordMap, t])

  return (
    <nav className="glass-nav">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          minWidth: 0
        }}
      >
        {isSideNavCollapsed && onToggleMobileMenu && (
          <MobileMenuButton onToggle={onToggleMobileMenu} />
        )}
        <div className="glass-breadcrumb">
          <Breadcrumb 
            breadcrumbs={breadcrumbs} 
            isMobile={isMobile} 
            pathname={router.pathname} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!isMobile && <PageSocial header />}
        <LanguageSwitcher />
        <ToggleThemeButton />
        {isSearchEnabled && <SearchModal />}
      </div>
    </nav>
  )
}
