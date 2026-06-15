import React from 'react'
import { useRouter } from 'next/router'
import { PostList } from '@/components/PostList'
import localeConfig from '../../site.locale.json'

import type { SiteMap } from '@/lib/context/types'

interface RecentPostsProps {
  siteMap?: SiteMap
}

export default function RecentPosts({
  siteMap,
  isMobile
}: RecentPostsProps & { isMobile?: boolean }) {
  const router = useRouter()
  const currentLocale = router.locale || localeConfig.defaultLocale

  const recentPosts = React.useMemo(() => {
    if (!siteMap) return []
    return Object.values(siteMap.pageInfoMap)
      .filter((page) => page.type === 'Post' || page.type === 'Home')
      .filter(
        (page) =>
          (page.language || localeConfig.defaultLocale) === currentLocale
      )
      .map((page) => ({
        pageId: page.pageId,
        title: page.title,
        description: page.description,
        date: page.date,
        slug: page.slug,
        language: page.language || localeConfig.defaultLocale,
        coverImage: page.coverImage || undefined,
        coverImageBlock: page.coverImageBlock || undefined
      }))
  }, [siteMap, currentLocale])

  return (
    <PostList
      posts={recentPosts}
      postsPerPage={6}
      emptyMessage='No recent posts found.'
      emptyDescription='Check back later for new content.'
      isMobile={isMobile}
    />
  )
}
