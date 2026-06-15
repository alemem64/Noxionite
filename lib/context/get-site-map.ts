import type { ExtendedRecordMap, PageBlock } from 'notion-types'
import { getBlockValue, getPageProperty } from 'notion-utils'

import type { CanonicalPageMap, PageInfo, SiteMap, DatabaseInfo } from './types'
import * as config from '../config'
import { mapImageUrl } from '../map-image-url'
import { notion } from '../notion-api'
import { buildTagGraphData } from './tag-graph'

// Custom function to parse Notion relation properties
function parseRelationProperty(
  propertyName: string,
  block: PageBlock,
  collectionRecordMap: ExtendedRecordMap
): string[] {
  const collection =
    getBlockValue(collectionRecordMap.collection[block.parent_id]) ||
    getBlockValue(Object.values(collectionRecordMap.collection)[0])
  if (!collection) {
    return []
  }

  const propertyId = Object.keys(collection.schema).find(
    (key) => collection.schema[key]?.name === propertyName
  )

  if (!propertyId) {
    return []
  }

  const rawValue = (block.properties as Record<string, any>)?.[propertyId]

  if (!rawValue || !Array.isArray(rawValue)) {
    return []
  }

  // The raw value of a relation property is an array of arrays,
  // where each inner array contains metadata about the related page.
  // The page ID is usually in the format ['‣', [['p', 'page-id']]]
  return rawValue
    .map((item) => {
      if (
        Array.isArray(item) &&
        item.length > 1 &&
        Array.isArray(item[1]) &&
        item[1].length > 0 &&
        Array.isArray(item[1][0]) &&
        item[1][0].length > 1 &&
        typeof item[1][0][1] === 'string'
      ) {
        return item[1][0][1]
      }
      return null
    })
    .filter((id): id is string => !!id)
}

/**
 * The main function to fetch all data from Notion and build the site map.
 * It's memoized to avoid re-fetching data on every call during a single build.
 */
function removeCircularDependencies(pages: PageInfo[]): void {
  for (const page of pages) {
    // The 'parent' property creates a circular reference, which causes issues with
    // Next.js's data serialization. We delete it here to prevent those errors.
    delete (page as any).parent
    if (page.children && page.children.length > 0) {
      removeCircularDependencies(page.children)
    }
  }
}

/**
 * The main function to fetch all data from Notion and build the site map.
 * It's memoized to avoid re-fetching data on every call during a single build.
 */
export const getSiteMap = async (): Promise<SiteMap> => {
  const notionDbIds = config.notionDbIds
  let pageInfoMap: Record<string, PageInfo> = {}
  const databaseInfoMap: Record<string, DatabaseInfo> = {}

  // Build databaseInfoMap from Database-type pages
  if (notionDbIds && notionDbIds.length > 0) {
    // Fetch all pages from databases
    const allPages = await Promise.all(
      notionDbIds.map((dbId: string) => getAllPagesFromDatabase(dbId))
    )
    pageInfoMap = allPages.reduce((acc: Record<string, PageInfo>, currentMap: Record<string, PageInfo>) => ({ ...acc, ...currentMap }), {})
    
    // Build databaseInfoMap from Database-type pages
    for (const [_pageId, pageInfo] of Object.entries(pageInfoMap)) {
      if (pageInfo.type === 'Database' && pageInfo.parentDbId) {
        const dbId = pageInfo.parentDbId
        
        // Create a unique key combining dbId and language to support multiple Database pages per dbId
        const uniqueKey = `${dbId}_${pageInfo.language || 'default'}`
        
        // Use the Database page's info to build DatabaseInfo
        databaseInfoMap[uniqueKey] = {
          id: dbId,
          name: pageInfo.title,
          slug: pageInfo.slug,
          language: pageInfo.language,
          coverImage: pageInfo.coverImage || null,
        }
      }
    }
  } else {
    console.warn(
      'WARN: No notionDbIds configured, so no pages will be rendered.'
    )
    pageInfoMap = {}
  }

  // Generate breadcrumbs for all pages in the pageInfoMap
  for (const pageId of Object.keys(pageInfoMap)) {
    const page = pageInfoMap[pageId]
    if (page) {
      const breadcrumb: string[] = []
      let current: PageInfo | undefined = page
      
      while (current) {
        breadcrumb.unshift(current.title)
        current = pageInfoMap[current.parentPageId || ''] || undefined
      }
      
      pageInfoMap[pageId].breadcrumb = breadcrumb
    }
  }
  
  const navigationTree = buildNavigationTree(pageInfoMap)
  removeCircularDependencies(navigationTree) // This removes the circular 'parent' property
  const canonicalPageMap = buildCanonicalPageMap(pageInfoMap)
  const tagGraphData = buildTagGraphData({ 
    site: config.site, 
    pageInfoMap, 
    navigationTree, 
    canonicalPageMap,
    lastUpdated: Date.now()
  })

  return {
    site: config.site,
    pageInfoMap,
    navigationTree,
    canonicalPageMap,
    tagGraphData,
    databaseInfoMap,
    lastUpdated: Date.now()
  }
}

/**
 * Fetches all pages from the root Notion database.
 * @param databaseId The ID of the Notion database.
 * @returns A map of page IDs to their info.
 */
async function getAllPagesFromDatabase(
  databaseId?: string
): Promise<Record<string, PageInfo>> {
  if (!databaseId) {
    return {}
  }

  try {
    const recordMap = await notion.getPage(databaseId)
    const collectionId = Object.keys(recordMap.collection)[0]
    const collectionViewId = Object.keys(recordMap.collection_view)[0]

    if (!collectionId || !collectionViewId) {
      return {}
    }

    const collectionView = getBlockValue(recordMap.collection_view[collectionViewId])

    const collectionData = await notion.getCollectionData(
      collectionId,
      collectionViewId,
      collectionView || { type: 'table' }
    )

    let blockIds: string[] = []
    if (collectionData.result?.blockIds) {
      blockIds = collectionData.result.blockIds
    } else if (
      collectionData.result?.reducerResults?.collection_group_results?.blockIds
    ) {
      blockIds =
        collectionData.result.reducerResults.collection_group_results.blockIds
    }

    if (!blockIds || blockIds.length === 0) {
      return {}
    }

    const pageIds = blockIds
  

    const pageInfoMap: Record<string, PageInfo> = {}
    const collectionRecordMap = collectionData.recordMap as ExtendedRecordMap

    for (const pageId of pageIds) {
      const block = getBlockValue(collectionRecordMap.block[pageId])
      if (!block) {
        console.warn(`WARN: No block found for pageId: ${pageId}`)
        continue
      }
      
      // Use actual Notion page ID from the block
      const actualNotionPageId = block.id
      
      const title = getPageProperty<string>('Title', block, collectionRecordMap)
      const slug = getPageProperty<string>('Slug', block, collectionRecordMap)
      const pageType: PageInfo['type'] =
        (getPageProperty<string>(
          'Type',
          block,
          collectionRecordMap
        ) as PageInfo['type']) || 'Unknown'
      const isPublic = getPageProperty<boolean>(
        'Public',
        block,
        collectionRecordMap
      )

      const parentPageId =
        parseRelationProperty(
          'Parent',
          block as PageBlock,
          collectionRecordMap
        )[0] || null

      const childrenPageIds = parseRelationProperty(
        'Children',
        block as PageBlock,
        collectionRecordMap
      )

      if (!title || !slug || !pageType) {
        console.warn(
          `WARN: Page "${actualNotionPageId}" (title: "${title}") is missing required properties. Title: ${!!title}, Slug: ${!!slug}, Type: ${!!pageType}. It will be skipped.`
        )
        continue
      }

      if (!isPublic) {
        continue
      }

      const coverImageUrl = (block as PageBlock).format?.page_cover
      const processedCoverImage = coverImageUrl
        ? mapImageUrl(coverImageUrl, block)
        : null

      pageInfoMap[actualNotionPageId] = {
        pageId: actualNotionPageId,
        title,
        slug,
        type: pageType,
        public: isPublic,
        language:
          getPageProperty<string>('Language', block, collectionRecordMap) || null,
        parentPageId,
        parentDbId: databaseId,
        childrenPageIds,
        description:
          getPageProperty<string>('Description', block, collectionRecordMap) ||
          null,
        date: getPageProperty<number>(
          'Published',
          block,
          collectionRecordMap
        )
          ? new Date(
              getPageProperty<number>('Published', block, collectionRecordMap)!
            ).toISOString()
          : null,
        coverImage: processedCoverImage,
        coverImageBlock: block,
        useOriginalCoverImage:
          getPageProperty<boolean>('Use Original Cover Image', block, collectionRecordMap) ||
          null,
        tags: getPageProperty<string[]>('Tags', block, collectionRecordMap) || [],
        authors: getPageProperty<string[]>('Authors', block, collectionRecordMap) || [],
        children: []
      }
    }

    return pageInfoMap
  } catch (err) {
    console.error('ERROR: Failed to fetch from Notion database:', err)
    return {}
  }
}

/**
 * Builds a hierarchical navigation tree from a flat map of page information.
 * @param pageInfoMap A map of page IDs to their info.
 * @returns An array of root-level pages, each with its children nested inside.
 */
function buildNavigationTree(pageInfoMap: Record<string, PageInfo>): PageInfo[] {
  const pageInfoArray = Object.values(pageInfoMap)

  const createPageCopy = (page: PageInfo): PageInfo => {
    return {
      ...page,
      children: []
    }
  }

  const pageCopyMap = new Map(
    pageInfoArray.map((p) => [p.pageId, createPageCopy(p)])
  )


  for (const page of pageInfoArray) {
    const pageCopy = pageCopyMap.get(page.pageId)
    if (!pageCopy) continue

    // Handle parent-child relationships first
    if (page.parentPageId) {
      const parentCopy = pageCopyMap.get(page.parentPageId)
      if (parentCopy) {
        parentCopy.children.push(pageCopy)
        pageCopy.parent = parentCopy
      }
    }
  }

  // Breadcrumbs are now generated in getSiteMap directly

  const rootPages = Array.from(pageCopyMap.values()).filter((p) => !p.parent)

  return rootPages
}

/**
 * Builds a map from canonical page URLs (slugs) to page IDs.
 * @param pageInfoMap A map of page IDs to their info.
 * @returns A map of slugs to page IDs.
 */
function buildCanonicalPageMap(
  pageInfoMap: Record<string, PageInfo>
): CanonicalPageMap {
  const canonicalPageMap: CanonicalPageMap = {}

  for (const pageId of Object.keys(pageInfoMap)) {
    const pageInfo = pageInfoMap[pageId]!
    if (pageInfo.public && pageInfo.slug) {
      // if (canonicalPageMap[pageInfo.slug]) {
      //   // console.warn(
      //   //   `WARN: Duplicate slug "${pageInfo.slug}" found for pages "${pageId}" and "${canonicalPageMap[pageInfo.slug]}". This may cause unexpected behavior.`
      //   // )
      // }
      canonicalPageMap[pageInfo.slug] = pageId
    }
  }

  return canonicalPageMap
}
