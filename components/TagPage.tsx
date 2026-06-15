import * as React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { PostList } from '@/components/PostList'
import type * as types from '@/lib/context/types'
import siteConfig from '../site.config'

export interface TagPageProps {
  pageProps: types.PageProps
  tag: string
  isMobile?: boolean
}

export function TagPage({ pageProps, tag, isMobile }: TagPageProps) {
  const { siteMap } = pageProps
  const router = useRouter()
  const locale = router.locale
  const { t } = useTranslation('common')

  // Get all posts that have this tag
  const postsWithTag = React.useMemo(() => {
    if (!siteMap?.pageInfoMap) return []

    const allPosts = Object.values(siteMap.pageInfoMap).filter(
      (page) =>
        page.type === 'Post' || (page.type === 'Home' && page.public === true)
    )

    // Filter posts by tag and current locale
    return allPosts.filter((post) => {
      // Check if the post has the specific tag
      const hasTag =
        post.tags?.some(
          (postTag: string) => postTag.toLowerCase() === tag.toLowerCase()
        ) || false

      // Also filter by current locale to prevent showing posts from all languages
      const postLanguage = post.language || siteConfig.locale.defaultLocale

      return hasTag && postLanguage === locale
    })
  }, [siteMap?.pageInfoMap, tag, locale])

  // Format posts for PostList component
  const formattedPosts = React.useMemo(() => {
    return postsWithTag.map((post) => ({
      pageId: post.pageId,
      title: post.title,
      description: post.description,
      date: post.date,
      slug: post.slug,
      language: post.language || siteConfig.locale.defaultLocale,
      coverImage: post.coverImage || undefined,
      coverImageBlock: post.coverImageBlock || undefined
    }))
  }, [postsWithTag])

  return (
    <PostList
      posts={formattedPosts}
      title={`#${tag}`}
      description={t('postsTaggedWithCount', { count: postsWithTag.length })}
      emptyMessage={t('noPostsFound')}
      emptyDescription={`${t('noPostsWithTag')} "${tag}"`}
      isMobile={isMobile}
    />
  )
}
