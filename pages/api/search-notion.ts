import type { ExtendedRecordMap } from 'notion-types'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { getBlockTitle, getBlockValue } from 'notion-utils'

import type * as types from '../../lib/context/types'
import { buildPageUrl } from '../../lib/context/build-page-url'

import { getSiteMap } from '../../lib/context/get-site-map'
import { search } from '../../lib/notion'

const buildBreadcrumbFromSiteMap = (
  pageId: string,
  siteMap: types.SiteMap
): Array<{ title: string }> | null => {
  const breadcrumbs: Array<{ title: string }> = []
  let currentPageId: string | undefined = pageId

  while (currentPageId) {
    const pageInfo: types.PageInfo | undefined = siteMap.pageInfoMap[currentPageId]
    if (pageInfo) {
      breadcrumbs.unshift({ title: pageInfo.title })
    }
    currentPageId = pageInfo?.parentPageId || undefined
  }

  if (breadcrumbs.length > 0) {
    breadcrumbs.unshift({ title: siteMap.site.name })
  }

  return breadcrumbs.length > 0 ? breadcrumbs : null
}

export default async function searchNotion(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  const searchParams: types.SearchParams = req.body



  // Fetch site map and search results
  const siteMap = await getSiteMap()
  const results = await search(searchParams)

  // Use the recordMap from the search results to resolve titles
  const recordMap = results.recordMap as ExtendedRecordMap

  const augmentedResults = results.results
    .map((result) => {
      const block = getBlockValue(recordMap.block[result.id])
      if (!block) {
        return null
      }

      const pageInfo = siteMap.pageInfoMap[result.id]
      if (!pageInfo) {
        return null
      }

      const title = getBlockTitle(block, recordMap)
      const url = buildPageUrl(result.id, siteMap)
      const type = pageInfo.type
      const breadcrumb = buildBreadcrumbFromSiteMap(result.id, siteMap)

      if (!title) {
        return null
      }

      return {
        id: result.id,
        title,
        type,
        url,
        breadcrumb
      }
    })
    .filter(Boolean)
    .filter((result) => result && (result.type === 'Post' || result.type === 'Category' || result.type === 'Home'))



  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
  )
  res.status(200).json({ results: augmentedResults })
}
