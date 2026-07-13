import type { GetServerSideProps } from 'next'

import { getCachedSiteMap } from '@/lib/context/site-cache'
import { renderSitemapXml } from '@/lib/seo'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return {
      props: {}
    }
  }

  const siteMap = await getCachedSiteMap()
  const sitemap = renderSitemapXml(siteMap)

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')
  if (req.method !== 'HEAD') {
    res.write(sitemap)
  }
  res.end()

  return {
    props: {}
  }
}

export default function noop() {
  return null
}
