'use client'

import cs from 'classnames'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'

import type * as types from '@/lib/context/types'
import { useDarkMode } from '@/lib/use-dark-mode'
import styles from '@/styles/components/SideNav.module.css'

import { CategoryTree } from './CategoryTree'
import { UnifiedGraphView } from './graph/UnifiedGraphView'
import { HomeButton } from './HomeButton'

function filterNavigationItems(
  items: types.PageInfo[],
  currentLocale: string
): types.PageInfo[] {
  if (!items || !Array.isArray(items)) return []

  return items
    .filter((item: types.PageInfo) => {
      if (!item.language) return true
      return item.language.toLowerCase() === currentLocale?.toLowerCase()
    })
    .map((item: types.PageInfo) => {
      if (item.children && Array.isArray(item.children)) {
        return {
          ...item,
          children: filterNavigationItems(item.children, currentLocale)
        }
      }
      return item
    })
}

const findPathToActiveItem = (
  items: types.PageInfo[],
  activeSlug: string
): string[] | null => {
  const cleanedActiveSlug = activeSlug
    .split('?')[0]
    .split('#')[0]
    .replace(/^\//, '')
    .replace(/\/$/, '')

  for (const item of items) {
    // Check exact slug match
    if (item.slug === cleanedActiveSlug) {
      return [item.pageId]
    }

    // Handle hierarchical paths (e.g., "features/some-page")
    const pathParts = cleanedActiveSlug.split('/')
    if (pathParts.length > 1) {
      // Check if any part of the path matches this item
      for (const part of pathParts) {
        if (item.slug === part) {
          // Check children for the remaining path
          if (item.children) {
            const childPath = findPathToActiveItem(item.children, activeSlug)
            if (childPath) {
              return [item.pageId, ...childPath]
            }
          }
          return [item.pageId]
        }
      }
    }

    // Check children recursively
    if (item.children) {
      const childPath = findPathToActiveItem(item.children, activeSlug)
      if (childPath) {
        return [item.pageId, ...childPath]
      }
    }
  }
  return null
}

interface SideNavProps {
  siteMap: types.SiteMap | undefined
  isCollapsed?: boolean
  isMobileMenuOpen?: boolean
}

export function SideNav({
  siteMap,
  isCollapsed = false,
  isMobileMenuOpen = false
}: SideNavProps) {
  const router = useRouter()
  const { locale, asPath } = router
  const { isDarkMode } = useDarkMode()

  const navRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({
    opacity: 0
  })
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  )

  const filteredNavigationTree = React.useMemo(() => {
    if (!siteMap?.navigationTree || !locale) {
      return siteMap?.navigationTree || []
    }
    return filterNavigationItems(siteMap.navigationTree, locale)
  }, [siteMap?.navigationTree, locale])

  // Create database items for the category tree using databaseInfoMap
  const databaseItems = React.useMemo((): types.PageInfo[] => {
    if (!siteMap?.databaseInfoMap) {
      return filteredNavigationTree
    }

    // Group database info by actual database ID (remove language suffix)
    const dbInfoById: Record<string, types.DatabaseInfo[]> = {}
    Object.values(siteMap.databaseInfoMap).forEach((dbInfo) => {
      if (!dbInfoById[dbInfo.id]) {
        dbInfoById[dbInfo.id] = []
      }
      dbInfoById[dbInfo.id].push(dbInfo)
    })

    // Select the appropriate language version for each database
    const selectedDbInfo: types.DatabaseInfo[] = []

    Object.entries(dbInfoById).forEach(([_dbId, dbInfos]) => {
      // Find the best match for current locale
      let selected = dbInfos.find(
        (info) => info.language?.toLowerCase() === locale?.toLowerCase()
      )

      // Fallback to any available version if no locale match
      if (!selected && dbInfos.length > 0) {
        selected = dbInfos[0]
      }

      if (selected) {
        selectedDbInfo.push(selected)
      }
    })

    const result = selectedDbInfo.map(
      (dbInfo: types.DatabaseInfo): types.PageInfo => {
        const dbChildren = filteredNavigationTree.filter(
          (rootPage) =>
            rootPage.parentDbId === dbInfo.id && rootPage.type !== 'Database'
        )

        return {
          title: dbInfo.name,
          pageId: dbInfo.id,
          type: 'Category' as const,
          slug: dbInfo.slug,
          parentPageId: null,
          childrenPageIds: dbChildren.map((child) => child.pageId),
          language: dbInfo.language,
          public: true,
          useOriginalCoverImage: false,
          description: null,
          date: null,
          coverImage: dbInfo.coverImage,
          coverImageBlock: undefined,
          tags: [],
          authors: [],
          breadcrumb: [],
          children: dbChildren,
          canonicalPageUrl: `/${dbInfo.slug}`
        }
      }
    )

    return result
  }, [filteredNavigationTree, siteMap?.databaseInfoMap, locale])

  useEffect(() => {
    // Use the actual navigation tree for path finding
    const itemsToSearch = siteMap?.databaseInfoMap
      ? databaseItems
      : filteredNavigationTree
    if (!itemsToSearch || itemsToSearch.length === 0) return

    const newExpandedState: Record<string, boolean> = {}

    // 현재 위치를 찾아서 그 위치의 부모들만 펼친다
    const activePath = findPathToActiveItem(itemsToSearch, asPath)

    if (activePath) {
      activePath.slice(0, -1).forEach((id) => {
        newExpandedState[id] = true
      })
    }

    setExpandedItems(newExpandedState)
  }, [databaseItems, filteredNavigationTree, asPath, siteMap?.databaseInfoMap])

  const toggleItemExpanded = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return

    const mouseX = e.clientX
    const mouseY = e.clientY

    let closestId: string | null = null
    let minDistance = Infinity

    const items = navRef.current.querySelectorAll<HTMLElement>('.sidenav-item')
    items.forEach((elem) => {
      const isInsideCollapsedContainer = elem.closest(
        '[class*="childrenContainer"]:not([class*="expanded"])'
      )
      const isRendered = elem.offsetWidth > 0 && elem.offsetHeight > 0

      if (!isInsideCollapsedContainer && isRendered) {
        const itemRect = elem.getBoundingClientRect()
        const itemCenterX = itemRect.left + itemRect.width / 2
        const itemCenterY = itemRect.top + itemRect.height / 2

        const dx = mouseX - itemCenterX
        const dy = mouseY - itemCenterY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) {
          minDistance = distance
          closestId = elem.dataset.pageId || null
        }
      }
    })

    setHoveredItemId(closestId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredItemId(null)
  }, [])

  useEffect(() => {
    if (!navRef.current) return

    let targetItem: HTMLElement | null = null

    if (hoveredItemId) {
      targetItem = navRef.current.querySelector<HTMLElement>(
        `[data-page-id="${hoveredItemId}"]`
      )
    } else {
      targetItem = navRef.current.querySelector<HTMLElement>(
        '.sidenav-item.active'
      )
    }

    if (targetItem) {
      const isInsideCollapsedContainer = targetItem.closest(
        '[class*="childrenContainer"]:not([class*="expanded"])'
      )
      const isRendered =
        targetItem.offsetWidth > 0 && targetItem.offsetHeight > 0

      if (!isInsideCollapsedContainer && isRendered) {
        const navRect = navRef.current.getBoundingClientRect()
        const itemRect = targetItem.getBoundingClientRect()

        setPillStyle({
          top: itemRect.top - navRect.top + navRef.current.scrollTop,
          left: itemRect.left - navRect.left,
          width: itemRect.width,
          height: itemRect.height,
          opacity: 1
        })
      } else {
        setPillStyle((prevStyle) => ({ ...prevStyle, opacity: 0 }))
      }
    } else {
      setPillStyle((prevStyle) => ({ ...prevStyle, opacity: 0 }))
    }
  }, [hoveredItemId, asPath, isMobileMenuOpen, siteMap, expandedItems])

  const asideClasses = cs(
    styles.sideNav,
    'glass-sidenav',
    isDarkMode && styles.darkMode,
    isCollapsed ? styles.mobile : styles.desktop,
    isCollapsed && isMobileMenuOpen && styles.mobileOpen
  )

  return (
    <aside className={asideClasses}>
      <HomeButton />
      <UnifiedGraphView
        siteMap={siteMap}
        viewType='sidenav'
        className={styles.graphContainer}
      />
      <div
        ref={navRef}
        className={styles.categoryTreeContainer}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className='sidenav-pill' style={pillStyle} />
        <CategoryTree
          items={databaseItems}
          expandedItems={expandedItems}
          toggleItemExpanded={toggleItemExpanded}
        />
      </div>
    </aside>
  )
}
