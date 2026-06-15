import React from 'react'
import { useRouter } from 'next/router'
import { useAppContext } from '@/lib/context/app-context'
import Magnet from './react-bits/Magnet'
import { graphControl } from '@/components/graph/utils/graph-control'

import styles from '@/styles/components/TagButton.module.css'

interface TagButtonProps {
  tag: string
}

export function TagButton({ tag }: TagButtonProps) {
  const router = useRouter()
  const { siteMap } = useAppContext()
  const locale = router.locale!

  if (!tag || tag.trim() === '') {
    return null
  }

  // Get tag count from siteMap using existing tag graph data
  const getTagCount = () => {
    try {
      const count =
        siteMap?.tagGraphData?.locales?.[locale]?.tagCounts?.[tag] || 0
      return count
    } catch (err) {
      console.warn('Error accessing tag count:', err)
      return 0
    }
  }

  const tagCount = getTagCount()

  const handleClick = () => {
    void router.push(`/tag/${encodeURIComponent(tag)}`)
  }

  const handleMouseEnter = () => {
    graphControl.changeViewAndFocusNode('tag_view', tag, 'sidenav')
  }

  return (
    <Magnet
      key={tag}
      padding={3}
      disabled={false}
      magnetStrength={3}
      activeTransition='transform 0.3s ease-out'
      inactiveTransition='transform 0.5s ease-in-out'
      wrapperClassName=''
      innerClassName=''
      style={{}}
    >
      <button
        className={`${styles.tagButton} ${tagCount > 0 ? styles.hasBadge : ''}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        type='button'
      >
        <div className={styles.tagContent}>
          <span className={styles.tagName}># {tag}</span>
          {tagCount > 0 && <span className={styles.tagCount}>{tagCount}</span>}
        </div>
      </button>
    </Magnet>
  )
}
