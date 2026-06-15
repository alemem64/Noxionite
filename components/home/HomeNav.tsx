import cs from 'classnames'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import styles from 'styles/components/home.module.css'
import { useTranslation } from 'next-i18next'

import type { PageInfo } from '@/lib/context/types'

interface HomeNavProps {
  homePages: PageInfo[]
  activeTab: string
  onNavClick: (tab: string, pageId?: string) => void
}

export default function HomeNav({
  homePages,
  activeTab,
  onNavClick
}: HomeNavProps) {
  const { t } = useTranslation('common')
  const navItems = ['recentPosts', 'graphView', 'allTags']
  const allNavItems = [
    ...homePages.map((page) => ({
      title: page.title,
      pageId: page.pageId,
      key: page.pageId
    })),
    ...navItems.map((item) => ({
      title: t(item),
      pageId: undefined,
      key: item
    }))
  ]

  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null)
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({
    opacity: 0
  })

  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return

    const navRect = navRef.current.getBoundingClientRect()
    const mouseX = e.clientX - navRect.left
    const mouseY = e.clientY - navRect.top

    let closestIndex = -1
    let minDistance = Infinity

    itemRefs.current.forEach((item, index) => {
      if (item) {
        const itemRect = item.getBoundingClientRect()
        const itemCenterX = itemRect.left - navRect.left + itemRect.width / 2
        const itemCenterY = itemRect.top - navRect.top + itemRect.height / 2

        const dx = mouseX - itemCenterX
        const dy = mouseY - itemCenterY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      }
    })

    setHoveredItemIndex(closestIndex)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredItemIndex(null)
  }, [])

  useEffect(() => {
    if (hoveredItemIndex !== null && itemRefs.current[hoveredItemIndex]) {
      const item = itemRefs.current[hoveredItemIndex]
      if (item) {
        setPillStyle({
          top: item.offsetTop,
          left: item.offsetLeft,
          width: item.offsetWidth,
          height: item.offsetHeight,
          opacity: 1
        })
      }
    } else {
      setPillStyle((prevStyle) => ({ ...prevStyle, opacity: 0 }))
    }
  }, [hoveredItemIndex])

  return (
    <nav
      ref={navRef}
      className={styles.homeNav}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.navPill} style={pillStyle} />
      {allNavItems.map((item, index) => (
        <button
          key={item.key}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          className={cs(
            styles.navItem,
            activeTab === item.key && styles.active
          )}
          onClick={() => onNavClick(item.key, item.pageId)}
        >
          {item.title}
        </button>
      ))}
    </nav>
  )
}
