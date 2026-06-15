import React, { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import localeConfig from '../../site.locale.json'
import { useGraphContext, GraphProvider } from './GraphProvider'
import {
  MdFullscreen,
  MdMyLocation,
  MdHome,
  MdOutlineFullscreenExit
} from 'react-icons/md'
import { PiGraphBold } from 'react-icons/pi'
import { FaTags } from 'react-icons/fa'
import styles from '@/styles/components/GraphView.module.css'
import type { SiteMap } from '@/lib/context/types'
import { PostGraphView } from './views/PostGraphView'
import { TagGraphView } from './views/TagGraphView'

import { graphControl } from './utils/graph-control'

interface UnifiedGraphViewProps {
  siteMap?: SiteMap
  recordMap?: any
  viewType?: 'home' | 'sidenav'
  className?: string
  currentTag?: string
}

const GraphContent: React.FC<{
  viewType: 'home' | 'sidenav'
  currentTag?: string
}> = ({ viewType, currentTag }) => {
  const { state, actions } = useGraphContext()
  const router = useRouter()
  const { t } = useTranslation('common')

  // Mouse tracking pill effect for view switcher
  const [hoveredViewIndex, setHoveredViewIndex] = useState<number | null>(null)
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({
    opacity: 0
  })
  const viewNavRef = useRef<HTMLElement>(null)
  const viewItemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Separate refs and state for modal view
  const [modalHoveredViewIndex, setModalHoveredViewIndex] = useState<
    number | null
  >(null)
  const [modalPillStyle, setModalPillStyle] = useState<React.CSSProperties>({
    opacity: 0
  })
  const modalViewNavRef = useRef<HTMLElement>(null)
  const modalViewItemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Automatically handle URL-based focus on mount and route changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      graphControl.handleUrlInitialFocus(window.location.pathname, viewType)
    }
  }, [viewType, router.asPath]) // Re-run when route changes

  const getDimensions = (): { width: number; height: number } | null => {
    switch (viewType) {
      case 'sidenav':
        return null // Use responsive sizing
      case 'home':
      default:
        return null // Use CSS classes for responsive sizing
    }
  }

  const dimensions = getDimensions()

  const handleViewChange = useCallback(
    (view: 'post_view' | 'tag_view') => {
      actions.setCurrentView(view)

      // Always trigger URL focus when switching views
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          graphControl.handleUrlCurrentFocus(
            window.location.pathname,
            viewType,
            view,
            true
          )
        }
      }, 100)
    },
    [actions, viewType]
  )

  const handleViewNavMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!viewNavRef.current) return

      const navRect = viewNavRef.current.getBoundingClientRect()
      const mouseX = e.clientX - navRect.left
      const mouseY = e.clientY - navRect.top

      let closestIndex = -1
      let minDistance = Infinity

      viewItemRefs.current.forEach((item, index) => {
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

      setHoveredViewIndex(closestIndex)
    },
    []
  )

  const handleViewNavMouseLeave = useCallback(() => {
    setHoveredViewIndex(null)
  }, [])

  const handleModalViewNavMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!modalViewNavRef.current) return

      const navRect = modalViewNavRef.current.getBoundingClientRect()
      const mouseX = e.clientX - navRect.left
      const mouseY = e.clientY - navRect.top

      let closestIndex = -1
      let minDistance = Infinity

      modalViewItemRefs.current.forEach((item, index) => {
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

      setModalHoveredViewIndex(closestIndex)
    },
    []
  )

  const handleModalViewNavMouseLeave = useCallback(() => {
    setModalHoveredViewIndex(null)
  }, [])

  useEffect(() => {
    if (hoveredViewIndex !== null && viewItemRefs.current[hoveredViewIndex]) {
      const item = viewItemRefs.current[hoveredViewIndex]
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
  }, [hoveredViewIndex])

  useEffect(() => {
    if (
      modalHoveredViewIndex !== null &&
      modalViewItemRefs.current[modalHoveredViewIndex]
    ) {
      const item = modalViewItemRefs.current[modalHoveredViewIndex]
      if (item) {
        setModalPillStyle({
          top: item.offsetTop,
          left: item.offsetLeft,
          width: item.offsetWidth,
          height: item.offsetHeight,
          opacity: 1
        })
      }
    } else {
      setModalPillStyle((prevStyle) => ({ ...prevStyle, opacity: 0 }))
    }
  }, [modalHoveredViewIndex])

  const handleModalToggle = useCallback(() => {
    if (state.isModalOpen) {
      actions.closeModal()
    } else {
      actions.openModal()
    }
  }, [actions, state.isModalOpen])

  const handleFocusCurrent = useCallback(() => {
    if (typeof window !== 'undefined') {
      graphControl.handleUrlCurrentFocus(
        window.location.pathname,
        viewType,
        state.currentView
      )
    }
  }, [viewType, state.currentView, router.asPath]) // eslint-disable-line react-hooks/exhaustive-deps

  const shouldDisableLocationButton = useCallback(() => {
    if (typeof window === 'undefined') return false

    const pathname = window.location.pathname
    const segments = pathname.split('/').filter(Boolean)

    // Find the route segment (post, category, tag, all-tags)
    const routeTypes = new Set(['post', 'category', 'tag', 'all-tags'])
    let routeSegment = ''

    for (const segment of segments) {
      if (routeTypes.has(segment)) {
        routeSegment = segment
        break
      }
    }

    const currentView = state.currentView

    // Case 1: root/ - disable in both views
    if (segments.length < 2) {
      return true
    }

    // Case 2: root/(locale)/category - disable in tag view
    if (routeSegment === 'category' && currentView === 'tag_view') {
      return true
    }

    // Case 3: root/(locale)/tag - disable in post view
    if (routeSegment === 'tag' && currentView === 'post_view') {
      return true
    }

    // Case 4: root/(locale)/all-tags - disable in both views
    if (routeSegment === 'all-tags') {
      return true
    }

    // Default: enable button
    return false
  }, [state.currentView, router.asPath]) // eslint-disable-line react-hooks/exhaustive-deps

  const getLocationButtonTooltip = useCallback(() => {
    if (typeof window === 'undefined') return 'Focus on current page'

    const pathname = window.location.pathname
    const segments = pathname.split('/').filter(Boolean)

    const routeTypes = new Set(['post', 'category', 'tag', 'all-tags'])
    let routeSegment = ''

    for (const segment of segments) {
      if (routeTypes.has(segment)) {
        routeSegment = segment
        break
      }
    }

    const currentView = state.currentView

    if (segments.length === 0) {
      return 'Focus not available on home page'
    }

    if (routeSegment === 'category' && currentView === 'tag_view') {
      return 'Focus not available for categories in tag view'
    }

    if (routeSegment === 'tag' && currentView === 'post_view') {
      return 'Focus not available for tags in post view'
    }

    if (routeSegment === 'all-tags') {
      return 'Focus not available on all-tags page'
    }

    return 'Focus on current page'
  }, [state.currentView, router.asPath]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFitToHome = useCallback(() => {
    actions.zoomToFit()
  }, [actions])

  const modalContent = (
    <div className={styles.modalOverlay} onClick={handleModalToggle}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.viewNavContainer}>
          <nav
            ref={modalViewNavRef}
            className={styles.viewNav}
            onMouseMove={handleModalViewNavMouseMove}
            onMouseLeave={handleModalViewNavMouseLeave}
          >
            <div className={styles.viewNavPill} style={modalPillStyle} />
            <button
              ref={(el) => {
                modalViewItemRefs.current[0] = el
              }}
              className={`${styles.viewNavItem} ${state.currentView === 'post_view' ? styles.active : ''}`}
              onClick={() => handleViewChange('post_view')}
            >
              <PiGraphBold className={styles.viewNavIcon} />
              {t('postView')}
            </button>
            <button
              ref={(el) => {
                modalViewItemRefs.current[1] = el
              }}
              className={`${styles.viewNavItem} ${state.currentView === 'tag_view' ? styles.active : ''}`}
              onClick={() => handleViewChange('tag_view')}
            >
              <FaTags className={styles.viewNavIcon} />
              {t('tagView')}
            </button>
          </nav>
        </div>

        <div className={styles.modalGraphContainer}>
          <div className={styles.buttonContainer}>
            <button
              onClick={handleFocusCurrent}
              className={styles.button}
              aria-label='Focus on current'
              disabled={shouldDisableLocationButton()}
              title={getLocationButtonTooltip()}
            >
              <MdMyLocation size={20} />
            </button>
            <button
              onClick={handleFitToHome}
              className={styles.button}
              aria-label='Fit to home'
            >
              <MdHome size={20} />
            </button>
            <button
              onClick={handleModalToggle}
              className={styles.button}
              aria-label='Close fullscreen'
            >
              <MdOutlineFullscreenExit size={20} />
            </button>
          </div>

          {state.currentView === 'post_view' ? (
            <PostGraphView className='w-full h-full' />
          ) : (
            <TagGraphView className='w-full h-full' currentTag={currentTag} />
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div
      className={`${styles.graphContainer} ${viewType === 'home' ? styles.homeView : ''} ${viewType === 'sidenav' ? styles.sideNavView : ''}`}
    >
      <div className={styles.viewNavContainer}>
        <nav
          ref={viewNavRef}
          className={styles.viewNav}
          onMouseMove={handleViewNavMouseMove}
          onMouseLeave={handleViewNavMouseLeave}
        >
          <div className={styles.viewNavPill} style={pillStyle} />
          <button
            ref={(el) => {
              viewItemRefs.current[0] = el
            }}
            className={`${styles.viewNavItem} ${state.currentView === 'post_view' ? styles.active : ''}`}
            onClick={() => handleViewChange('post_view')}
          >
            <PiGraphBold className={styles.viewNavIcon} />
            {t('postView')}
          </button>
          <button
            ref={(el) => {
              viewItemRefs.current[1] = el
            }}
            className={`${styles.viewNavItem} ${state.currentView === 'tag_view' ? styles.active : ''}`}
            onClick={() => handleViewChange('tag_view')}
          >
            <FaTags className={styles.viewNavIcon} />
            {t('tagView')}
          </button>
        </nav>
      </div>

      <div className={styles.graphCanvasWrapper}>
        <div className={styles.buttonContainer}>
          <button
            onClick={handleFocusCurrent}
            className={styles.button}
            aria-label='Focus on current'
            disabled={shouldDisableLocationButton()}
            title={getLocationButtonTooltip()}
          >
            <MdMyLocation size={20} />
          </button>
          <button
            onClick={handleFitToHome}
            className={styles.button}
            aria-label='Fit to home'
          >
            <MdHome size={20} />
          </button>
          <button
            onClick={handleModalToggle}
            className={styles.button}
            aria-label='Open in fullscreen'
          >
            {state.isModalOpen ? (
              <MdOutlineFullscreenExit size={20} />
            ) : (
              <MdFullscreen size={20} />
            )}
          </button>
        </div>

        {state.currentView === 'post_view' ? (
          dimensions && dimensions.width && dimensions.height ? (
            <PostGraphView
              className={styles.graphInner}
              width={dimensions.width}
              height={dimensions.height}
            />
          ) : (
            <PostGraphView className={styles.graphInner} />
          )
        ) : dimensions && dimensions.width && dimensions.height ? (
          <TagGraphView
            className={styles.graphInner}
            width={dimensions.width}
            height={dimensions.height}
            currentTag={currentTag}
          />
        ) : (
          <TagGraphView className={styles.graphInner} currentTag={currentTag} />
        )}
      </div>

      {state.isModalOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          modalContent,
          document.getElementById('modal-root') || document.body
        )}
    </div>
  )
}

export const UnifiedGraphView: React.FC<UnifiedGraphViewProps> = ({
  siteMap,
  recordMap,
  viewType = 'home',
  className,
  currentTag
}) => {
  const router = useRouter()
  const locale = router.locale || localeConfig.defaultLocale

  return (
    <GraphProvider
      siteMap={siteMap}
      recordMap={recordMap}
      locale={locale}
      instanceType={viewType}
    >
      <div className={className}>
        <GraphContent viewType={viewType} currentTag={currentTag} />
      </div>
    </GraphProvider>
  )
}
