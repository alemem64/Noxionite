import type { PageInfo, SiteMap } from './types'

function shouldIncludeLocale(
  value: string | null | undefined,
  locale?: string
): boolean {
  return !locale || !value || value === locale
}

function toClientPageInfo(pageInfo: PageInfo): PageInfo {
  const {
    coverImageBlock: _coverImageBlock,
    parent: _parent,
    children: _children,
    ...clientPageInfo
  } = pageInfo

  return {
    ...clientPageInfo,
    coverImageBlock: null,
    children: [] as PageInfo[]
  }
}

function buildNavigationTree(
  pageInfoMap: Record<string, PageInfo>
): PageInfo[] {
  const pageCopyMap = new Map<string, PageInfo>(
    Object.values(pageInfoMap).map((page) => [
      page.pageId,
      {
        ...page,
        children: [] as PageInfo[]
      }
    ])
  )

  const rootPages: PageInfo[] = []

  for (const page of pageCopyMap.values()) {
    const parent = page.parentPageId
      ? pageCopyMap.get(page.parentPageId)
      : undefined

    if (parent) {
      parent.children.push(page)
    } else {
      rootPages.push(page)
    }
  }

  return rootPages
}

export function serializeSiteMapForPage(
  siteMap: SiteMap,
  locale?: string
): SiteMap {
  const pageInfoMap = Object.fromEntries(
    Object.entries(siteMap.pageInfoMap)
      .filter(([, pageInfo]) => shouldIncludeLocale(pageInfo.language, locale))
      .map(([pageId, pageInfo]) => [pageId, toClientPageInfo(pageInfo)])
  )
  const databaseInfoMap = Object.fromEntries(
    Object.entries(siteMap.databaseInfoMap || {}).filter(([, dbInfo]) =>
      shouldIncludeLocale(dbInfo.language, locale)
    )
  )
  const tagGraphData =
    locale && siteMap.tagGraphData?.locales?.[locale]
      ? {
          ...siteMap.tagGraphData,
          locales: {
            [locale]: siteMap.tagGraphData.locales[locale]
          },
          totalPosts: siteMap.tagGraphData.locales[locale].totalPosts
        }
      : siteMap.tagGraphData
  const canonicalPageMap = Object.fromEntries(
    Object.entries(siteMap.canonicalPageMap || {}).filter(([, pageId]) =>
      Boolean(pageInfoMap[pageId])
    )
  )

  return {
    ...siteMap,
    pageInfoMap,
    navigationTree: [],
    canonicalPageMap,
    tagGraphData,
    databaseInfoMap
  }
}

export function hydrateClientSiteMap(
  siteMap: SiteMap | undefined
): SiteMap | undefined {
  if (!siteMap) {
    return undefined
  }

  if (siteMap.navigationTree?.length) {
    return siteMap
  }

  return {
    ...siteMap,
    navigationTree: buildNavigationTree(siteMap.pageInfoMap)
  }
}

export function serializePageInfoForPage(pageInfo: PageInfo): PageInfo {
  const clientPageInfo = toClientPageInfo(pageInfo)

  return {
    ...clientPageInfo,
    children: pageInfo.children?.map(toClientPageInfo) || []
  }
}
