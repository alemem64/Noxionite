import type { SiteMap } from '@/lib/context/types'
import type { LocaleTagGraphData } from '@/lib/context/tag-graph'
import type { GraphData, GraphNode, GraphLink } from '../types/graph.types'
import { HOME_NODE_ID, ALL_TAGS_NODE_ID, GRAPH_CONFIG } from './graphConfig'
import siteConfig from 'site.config'
import siteLocaleConfig from '../../../site.locale.json'

// Image cache for better performance
const imageCache = new Map<string, HTMLImageElement>()

export const preloadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      resolve(imageCache.get(url)!)
      return
    }

    const img = new Image()
    img.addEventListener('load', () => {
      imageCache.set(url, img)
      resolve(img)
    })
    img.addEventListener('error', reject)
    img.src = url
  })
}

export const createPostGraphData = (
  siteMap: SiteMap,
  locale: string
): GraphData => {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const processedPages = new Set<string>()

  if (!siteMap?.pageInfoMap) {
    return { nodes: [], links: [] }
  }

  // Create home node with favicon
  const homeImageUrl = '/icon.png'
  const homeNode: GraphNode = {
    id: HOME_NODE_ID,
    name: siteConfig.name,
    description: siteConfig.description,
    type: 'Root' as any,
    url: '/',
    color: '#8B5CF6',
    size: GRAPH_CONFIG.visual.HOME_NODE_SIZE,
    val: GRAPH_CONFIG.visual.HOME_NODE_SIZE,
    imageUrl: homeImageUrl
  }

  // Preload home node image
  if (homeImageUrl) {
    preloadImage(homeImageUrl)
      .then((img) => {
        homeNode.img = img
      })
      .catch(() => {
        // Fallback to favicon emoji if image fails to load
        console.warn('Failed to load home node image')
      })
  }

  nodes.push(homeNode)

  // Create database nodes with proper names, slugs, and cover images
  const dbIds = siteConfig.notionDbIds || []
  const databaseNodes = new Map<string, GraphNode>()

  // Create database nodes for all databases using notionDbIds and databaseInfoMap
  dbIds.forEach((dbId) => {
    // The databaseInfoMap uses keys in format `${dbId}_${locale}` or `${dbId}_default`
    const dbKey = siteMap.databaseInfoMap?.[`${dbId}_${locale}`]
      ? `${dbId}_${locale}`
      : `${dbId}_default`

    // Get database info from siteMap.databaseInfoMap
    const dbInfo = siteMap.databaseInfoMap?.[dbKey]
    if (!dbInfo) return // Skip if database info not found

    const dbName =
      dbInfo.name && typeof dbInfo.name === 'object'
        ? (dbInfo.name as Record<string, string>)[locale] ||
          (dbInfo.name as Record<string, string>)[
            siteLocaleConfig.defaultLocale
          ] ||
          'Database'
        : typeof dbInfo.name === 'string'
          ? dbInfo.name
          : 'Database'
    const dbSlug = dbInfo.slug || dbId
    const coverImage = dbInfo.coverImage

    const dbNode: GraphNode = {
      id: dbId, // Use the actual dbId for node ID to match parentDbId values
      name: dbName,
      slug: dbSlug,
      url: `/category/${dbSlug}`,
      type: 'Database' as any,
      color: '#FF6B6B', // Red color for database nodes
      size: GRAPH_CONFIG.visual.DB_NODE_SIZE,
      val: GRAPH_CONFIG.visual.DB_NODE_SIZE,
      imageUrl: coverImage || undefined
    }

    // Preload database cover image if available
    if (coverImage) {
      preloadImage(coverImage)
        .then((img) => {
          dbNode.img = img
        })
        .catch(() => {
          console.warn(`Failed to load database cover image: ${coverImage}`)
        })
    }

    databaseNodes.set(dbId, dbNode)
    nodes.push(dbNode)

    // Database links will be created after all nodes are collected
  })

  // Create nodes for all pages (excluding Database-type pages)
  Object.entries(siteMap.pageInfoMap).forEach(([pageId, pageInfo]) => {
    if (processedPages.has(pageId)) return
    if (pageInfo.language !== locale) return
    if (pageInfo.type === 'Database') return // Skip Database-type pages

    const imageUrl = pageInfo.coverImage || undefined

    const node: GraphNode = {
      id: pageId,
      name: pageInfo.title || 'Untitled',
      slug: pageInfo.slug,
      url: pageInfo.slug ? `/${pageInfo.slug}` : '#',
      type: (pageInfo.type || 'Post') as any,
      color: pageInfo.type === 'Category' ? '#8B5CF6' : '#3B82F6',
      size:
        pageInfo.type === 'Category'
          ? GRAPH_CONFIG.visual.CATEGORY_NODE_SIZE
          : GRAPH_CONFIG.visual.POST_NODE_SIZE,
      imageUrl,
      val:
        pageInfo.type === 'Category'
          ? GRAPH_CONFIG.visual.CATEGORY_NODE_SIZE
          : GRAPH_CONFIG.visual.POST_NODE_SIZE
    }

    // Preload cover images
    if (imageUrl) {
      preloadImage(imageUrl)
        .then((img) => {
          node.img = img
        })
        .catch(() => {
          // Image failed to load, will use default styling
          console.warn(
            `Failed to load image for ${pageInfo.title}: ${imageUrl}`
          )
        })
    }

    nodes.push(node)
    processedPages.add(pageId)
  })

  // Collect all valid node IDs after all nodes are created
  const validNodeIds = new Set(nodes.map((n) => n.id))

  // Create database links after validation
  dbIds.forEach((dbId) => {
    if (validNodeIds.has(HOME_NODE_ID) && validNodeIds.has(dbId)) {
      links.push({
        source: HOME_NODE_ID,
        target: dbId,
        color: '#E5E7EB',
        width: 1.5
      })
    }
  })

  // Create links based on parent relationships - ensuring proper hierarchy
  Object.entries(siteMap.pageInfoMap).forEach(([pageId, pageInfo]) => {
    if (pageInfo.language !== locale) return
    if (pageInfo.type === 'Database') return

    if (pageInfo.parentDbId && pageInfo.parentDbId !== pageId) {
      // For pages within a database - connect to database first
      if (!pageInfo.parentPageId) {
        // Top-level items in database connect directly to their database
        // Only create link if database node exists
        if (
          databaseNodes.has(pageInfo.parentDbId) &&
          validNodeIds.has(pageInfo.parentDbId) &&
          validNodeIds.has(pageId)
        ) {
          links.push({
            source: pageInfo.parentDbId,
            target: pageId,
            color: '#E5E7EB',
            width: 1
          })
        } else if (validNodeIds.has(HOME_NODE_ID) && validNodeIds.has(pageId)) {
          // Fallback to home if database node doesn't exist
          links.push({
            source: HOME_NODE_ID,
            target: pageId,
            color: '#E5E7EB',
            width: 1
          })
        }
      } else if (
        siteMap.pageInfoMap[pageInfo.parentPageId] &&
        validNodeIds.has(pageInfo.parentPageId) &&
        validNodeIds.has(pageId)
      ) {
        // Child items connect to their parent within the hierarchy
        links.push({
          source: pageInfo.parentPageId,
          target: pageId,
          color: '#E5E7EB',
          width: 1
        })
      }
    } else if (
      pageInfo.parentPageId &&
      siteMap.pageInfoMap[pageInfo.parentPageId] &&
      validNodeIds.has(pageInfo.parentPageId) &&
      validNodeIds.has(pageId)
    ) {
      // Regular parent-child relationships for non-database items
      links.push({
        source: pageInfo.parentPageId,
        target: pageId,
        color: '#E5E7EB',
        width: 1
      })
    } else if (
      pageId !== HOME_NODE_ID &&
      validNodeIds.has(HOME_NODE_ID) &&
      validNodeIds.has(pageId)
    ) {
      // Standalone items link to home
      links.push({
        source: HOME_NODE_ID,
        target: pageId,
        color: '#E5E7EB',
        width: 1
      })
    }
  })

  return { nodes, links }
}

// Helper function to calculate node size based on count using logarithmic scale
const calculateNodeSize = (count: number): number => {
  if (count === 1) return 1
  else return Math.log(count + 1) * 10 + 5
}

export const createTagGraphData = (
  tagGraphData: LocaleTagGraphData | undefined,
  t: (key: string) => string,
  locale: string
): GraphData => {
  if (!tagGraphData) return { nodes: [], links: [] }

  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

  const tagCounts = tagGraphData.tagCounts || {}
  const tagRelationships = tagGraphData.tagRelationships || {}
  const tagPages = tagGraphData.tagPages || {}

  // Filter out empty or whitespace-only tags
  const validTags = new Set(
    Object.keys(tagCounts).filter((tag) => tag && tag.trim().length > 0)
  )

  // Build postTags: Map<string, string[]> postId to tags
  const postTags = new Map<string, string[]>()
  for (const [tag, pages] of Object.entries(tagPages)) {
    if (!validTags.has(tag)) continue // Skip invalid tags
    for (const post of pages) {
      if (!postTags.has(post)) {
        postTags.set(post, [])
      }
      postTags.get(post)!.push(tag)
    }
  }

  // Identify hubs and leafs
  const allTags = Array.from(validTags)
  const hubs = allTags.filter((tag) => tagCounts[tag] >= 2)
  // const leafs = allTags.filter(tag => tagCounts[tag] === 1); // leafs are handled inline

  // Build hub adjacency list
  const hubAdj = new Map<string, Set<string>>()
  for (const hub of hubs) {
    hubAdj.set(hub, new Set())
  }
  for (const [tag, related] of Object.entries(tagRelationships)) {
    if (!validTags.has(tag)) continue // Skip invalid tags
    if (hubs.includes(tag)) {
      for (const rel of related) {
        if (!validTags.has(rel)) continue // Skip invalid related tags
        if (hubs.includes(rel)) {
          hubAdj.get(tag)!.add(rel)
          hubAdj.get(rel)!.add(tag) // ensure undirected
        }
      }
    }
  }

  // Find connected components for hubs
  const visited = new Set<string>()
  const hubClusters: string[][] = []
  for (const hub of hubs) {
    if (!visited.has(hub)) {
      const component: string[] = []
      const stack = [hub]
      visited.add(hub)
      while (stack.length > 0) {
        const current = stack.pop()!
        component.push(current)
        for (const neighbor of hubAdj.get(current) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            stack.push(neighbor)
          }
        }
      }
      hubClusters.push(component)
    }
  }

  // Select ambassadors for each hub cluster
  const ambassadors = new Set<string>()
  for (const cluster of hubClusters) {
    // Sort: first by -count, then by tag name asc
    const sorted = cluster.slice().toSorted((a, b) => {
      const countDiff = tagCounts[b] - tagCounts[a]
      if (countDiff !== 0) return countDiff
      return a.localeCompare(b)
    })
    ambassadors.add(sorted[0])
  }

  // Now handle isolated leaf groups
  const isolatedLeafLinks: { source: string; target: string }[] = []
  for (const [_post, tags] of postTags) {
    const validPostTags = tags.filter((t) => validTags.has(t)) // Filter invalid tags
    const localHubs = validPostTags.filter((t) => tagCounts[t] >= 2)
    if (localHubs.length === 0 && validPostTags.length > 0) {
      // all leafs
      const sortedTags = validPostTags
        .slice()
        .toSorted((a, b) => a.localeCompare(b))
      const ambassador = sortedTags[0]
      ambassadors.add(ambassador)
      // connect other leafs to ambassador
      for (const leaf of sortedTags.slice(1)) {
        isolatedLeafLinks.push({ source: ambassador, target: leaf })
      }
    }
  }

  // Now create nodes
  // Root node
  const totalTags = allTags.length
  const allTagsNodeName = t('allTags')
  const rootNode: GraphNode = {
    id: ALL_TAGS_NODE_ID,
    name: allTagsNodeName,
    type: 'Root' as any,
    url: `/${locale}/all-tags`,
    color: '#059669',
    val: calculateNodeSize(totalTags),
    count: totalTags
  }
  nodes.push(rootNode)

  // Tag nodes
  for (const tag of allTags) {
    const count = tagCounts[tag]
    const isLeaf = count === 1 && !ambassadors.has(tag)
    const isAmbassador = ambassadors.has(tag)
    const isHub = count >= 2 && !isAmbassador
    let type = 'Tag'
    let color = '#10B981'
    if (isAmbassador) {
      type = 'Ambassador'
      color = '#059669'
    } else if (isHub) {
      type = 'Hub'
      color = '#34D399'
    } else if (isLeaf) {
      type = 'Leaf'
      color = '#6EE7B7'
    }
    const node: GraphNode = {
      id: tag,
      name: tag,
      url: `/${locale}/tag/${encodeURIComponent(tag)}`,
      type: type as any,
      color,
      val: calculateNodeSize(count),
      count: isLeaf ? undefined : count
    }
    nodes.push(node)
  }

  // Now add links
  const linkSet = new Set<string>()

  // Hub-hub links
  for (const [tag, related] of Object.entries(tagRelationships)) {
    if (!validTags.has(tag)) continue // Skip invalid tags
    if (tagCounts[tag] >= 2) {
      for (const rel of related) {
        if (!validTags.has(rel)) continue // Skip invalid related tags
        if (tagCounts[rel] >= 2) {
          const sorted = [tag, rel].toSorted()
          const key = sorted.join('-')
          if (!linkSet.has(key)) {
            linkSet.add(key)
            links.push({
              source: sorted[0],
              target: sorted[1],
              color: '#9CA3AF',
              width: 1
            })
          }
        }
      }
    }
  }

  // Leaf to hub links (for posts with hubs)
  for (const [_post, tags] of postTags) {
    const validPostTags = tags.filter((t) => validTags.has(t)) // Filter invalid tags
    const localHubs = validPostTags.filter((t) => tagCounts[t] >= 2)
    const localLeafs = validPostTags.filter(
      (t) => tagCounts[t] === 1 && !ambassadors.has(t)
    )
    if (localHubs.length > 0) {
      for (const leaf of localLeafs) {
        for (const hub of localHubs) {
          const sorted = [leaf, hub].toSorted()
          const key = sorted.join('-')
          if (!linkSet.has(key)) {
            linkSet.add(key)
            links.push({
              source: sorted[0],
              target: sorted[1],
              color: '#D1D5DB',
              width: 0.5
            })
          }
        }
      }
    }
  }

  // Isolated leaf links
  for (const link of isolatedLeafLinks) {
    const sorted = [link.source, link.target].toSorted()
    const key = sorted.join('-')
    if (!linkSet.has(key)) {
      linkSet.add(key)
      links.push({
        source: sorted[0],
        target: sorted[1],
        color: '#D1D5DB',
        width: 0.5
      })
    }
  }

  // Root to ambassadors
  for (const amb of ambassadors) {
    const sorted = [ALL_TAGS_NODE_ID, amb].toSorted()
    const key = sorted.join('-')
    if (!linkSet.has(key)) {
      linkSet.add(key)
      links.push({
        source: ALL_TAGS_NODE_ID,
        target: amb,
        color: '#D1D5DB',
        width: 0.5
      })
    }
  }

  return { nodes, links }
}

export const cleanupImageCache = () => {
  imageCache.clear()
}

// Memoization cache for processed data
const dataCache = new Map<string, GraphData>()

export const getCachedGraphData = (
  key: string,
  generator: () => GraphData
): GraphData => {
  if (dataCache.has(key)) {
    return dataCache.get(key)!
  }

  const data = generator()
  dataCache.set(key, data)
  return data
}

export const invalidateDataCache = () => {
  dataCache.clear()
}
