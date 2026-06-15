import type { GetServerSideProps } from 'next'
import RSS from 'rss'

import * as config from '@/lib/config'
import { getSiteMap } from '@/lib/context/get-site-map'
import { getSocialImageUrl } from '@/lib/get-social-image-url'
import { buildPageUrl } from '@/lib/context/build-page-url'
import { absoluteUrl } from '@/lib/seo'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const siteMap = await getSiteMap()
  const ttlMinutes = 24 * 60 // 24 hours
  const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    ttl: ttlMinutes
  })

  const posts = Object.values(siteMap.pageInfoMap)
    .filter((pageInfo) => pageInfo.public && pageInfo.type === 'Post')
    .toSorted((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0
      const bTime = b.date ? new Date(b.date).getTime() : 0
      return bTime - aTime
    })

  for (const pageInfo of posts) {
    const title = pageInfo.title || config.name
    const description = pageInfo.description || config.description
    const pageUrl = buildPageUrl(
      pageInfo.pageId,
      siteMap,
      [],
      pageInfo.language || config.language
    )
    const url = absoluteUrl(pageUrl) || config.host
    const date = pageInfo.date
      ? new Date(pageInfo.date)
      : new Date(siteMap.lastUpdated)
    const socialImageUrl = absoluteUrl(
      getSocialImageUrl(pageUrl, {
        title,
        description,
        type: 'article'
      })
    )

    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
            url: socialImageUrl,
            type: 'image/png'
          }
        : undefined
    })
  }

  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  if (req.method !== 'HEAD') {
    res.write(feedText)
  }
  res.end()

  return { props: {} }
}

export default function noop() {
  return null
}
