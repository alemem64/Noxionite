import cs from 'classnames'
import Image from 'next/image'
import { type PageBlock } from 'notion-types'
import { formatDate, getBlockTitle, getPageProperty } from 'notion-utils'
import React, { useState} from 'react'
import styles from 'styles/components/PostHeader.module.css'

import { mapImageUrl } from '@/lib/map-image-url'
import { AuthorButton } from './AuthorButton'
import { TagButton } from './TagButton'

interface PostHeaderProps {
  block: any
  recordMap: any
  siteMap?: any
  isBlogPost: boolean // Kept for logic, but rendering is controlled by variant
  isMobile?: boolean
  variant?: 'full' | 'simple'
  useOriginalCoverImage?: boolean
  url?: string
  hideCoverImage?: boolean
}

export function PostHeader({ 
  block, 
  recordMap, 
  isBlogPost,
  isMobile = false,
  variant = 'full', // Default to 'full'
  useOriginalCoverImage = false, // Default to true for backward compatibility
  url,
  hideCoverImage = false
}: PostHeaderProps) {
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)

  const socialImageUrl = useOriginalCoverImage || !url ? null : `/api/generate-social-image.tsx?path=${encodeURIComponent(url)}`

  // For 'full' variant, we require it to be a blog post from a collection
  if (variant === 'full' && (!isBlogPost || !block || block.parent_table !== 'collection')) {
    return null
  }

  // For 'simple' variant, we just need the block
  if (variant === 'simple' && !block) {
    return null
  }

  // Extract data
  const title = getBlockTitle(block, recordMap)
  const authors = getPageProperty<string[]>('Authors', block, recordMap) || []
  const published = getPageProperty<number>('Published', block, recordMap)
  
  // Tags logic remains the same...
  const tagsRaw = getPageProperty('Tags', block, recordMap)
  let tags: string[] = []
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw
      .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
      .map((tag: any) => tag.trim())
  } else if (typeof tagsRaw === 'string' && tagsRaw.trim().length > 0) {
    tags = [tagsRaw.trim()]
  } else if (tagsRaw && typeof tagsRaw === 'object') {
    const tagObj = tagsRaw as any
    if (tagObj.multi_select) {
      tags = tagObj.multi_select
        .map((tag: any) => tag.name || tag)
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag: any) => tag.trim())
    } else if (tagObj.name && typeof tagObj.name === 'string' && tagObj.name.trim().length > 0) {
      tags = [tagObj.name.trim()]
    }
  }
  
  const formattedPublished = published
    ? formatDate(published, { month: 'long' })
    : null

  const pageBlock = block as PageBlock
  const pageCover = pageBlock.format?.page_cover
  const coverImageUrl = pageCover ? mapImageUrl(pageCover, block) : null
  const coverPosition = pageBlock.format?.page_cover_position || 0.5

  // Determine which image to use
  const effectiveCoverImageUrl = useOriginalCoverImage 
    ? coverImageUrl 
    : socialImageUrl || coverImageUrl

  return (
    <div className={cs(styles.header, isMobile && styles.mobile)}>
      {/* Title */}
      <h1 className={styles.title}>
        {title}
      </h1>

      {/* Render metadata only for the 'full' variant */}
      {variant === 'full' && (
        <>
          {/* Author and Published Date Row */}
          {(authors.length > 0 || formattedPublished) && (
            <div className={styles.metadataRow}>
              {authors.length > 0 && (
                <div className={styles.authorList}>
                  {authors
                    .filter((name) => name && name.trim() !== '')
                    .map((authorName) => (
                    <AuthorButton key={authorName} authorName={authorName} />
                  ))}
                </div>
              )}
              {authors.length > 0 && formattedPublished && <span className={styles.separator}>•</span>}
              {formattedPublished && <span className={styles.publishedDate}>{formattedPublished}</span>}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className={styles.tagContainer}>
              {tags.map((tag, index) => (
                <TagButton 
                  key={index}
                  tag={tag}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Cover Image */}
      {!hideCoverImage && effectiveCoverImageUrl && (
        <div 
          className={styles.coverImageContainer}
          style={{
            aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : undefined,
            opacity: imageAspectRatio ? 1 : 0,
            borderRadius: imageAspectRatio ? '12px' : '0',
            boxShadow: imageAspectRatio
              ? '0 10px 30px rgba(0, 0, 0, 0.1)'
              : 'none',
          }}
        >
          <Image
            src={effectiveCoverImageUrl}
            alt={title || 'Cover image'}
            fill
            className={styles.coverImage}
            style={{
              objectPosition: useOriginalCoverImage ? `center ${(1 - coverPosition) * 100}%` : 'center'
            }}
            onLoadingComplete={({ naturalWidth, naturalHeight }) => {
              if (naturalHeight > 0) {
                setImageAspectRatio(naturalWidth / naturalHeight)
              }
            }}
            priority
            sizes="(max-width: 1024px) 100vw, 800px"
          />
        </div>
      )}
      

    </div>
  )
}