import type { NextApiRequest, NextApiResponse } from 'next'
import { parseUrlPathname } from '@/lib/context/url-parser'
import { getCachedSiteMap } from '@/lib/context/site-cache'
import siteConfig from 'site.config'
import { getBrowser, renderSocialImage } from '@/lib/og-images-manager'

// API handler for on-demand previews
async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  if (_req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const urlPath = _req.query.path as string || '/'
    const parsedUrl = parseUrlPathname(urlPath)

    // Support all URL types, not just root

    // Determine base URL based on environment
    const host = _req.headers.host || 'localhost:3000'
    const isDev = process.env.NODE_ENV === 'development' || host.includes('localhost')
    const baseUrl = isDev ? `http://${host}` : `https://${siteConfig.domain}`
    
    const urlParam = typeof _req.query.url === 'string' ? _req.query.url : 
                     typeof _req.query.path === 'string' ? _req.query.path : '/'
    
    // Log for debugging in Vercel
    if (process.env.VERCEL) {
      console.log(`[SocialImage API] Vercel environment - generating image for: ${urlParam}`)
    }
    

    
    const siteMap = await getCachedSiteMap()

    // Handle subpages by fetching actual Notion page data
    let enhancedSiteMap = siteMap;
    
    // Check if this is a subpage and extract page ID
    const pageIdMatch = urlParam.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    
    if (pageIdMatch && parsedUrl.isSubpage) {
      const pageId = pageIdMatch[1];

      
      try {
        // Import notion API client and utilities
        const { notion } = await import('@/lib/notion-api')
        const { getBlockTitle } = await import('notion-utils')
        const { mapImageUrl } = await import('@/lib/map-image-url')
        
        // Fetch the actual page data from Notion
        const recordMap = await notion.getPage(pageId)
        
        // Extract data from the fetched page
        const block = recordMap.block[pageId]?.value
        if (block) {
          const title = getBlockTitle(block, recordMap)
          const pageCover = block.format?.page_cover
          const coverImageUrl = pageCover ? mapImageUrl(pageCover, block) : null
          

          
          // Create enhanced page info for the subpage
          const subpageInfo = {
            title: title || 'Untitled',
            pageId,
            type: 'Post' as const,
            slug: parsedUrl.subpage || pageId,
            parentPageId: null,
            childrenPageIds: [],
            language: parsedUrl.locale || null,
            public: true,
            useOriginalCoverImage: null,
            description: null,
            date: null,
            coverImage: coverImageUrl || undefined,
            children: []
          }
          

          
          // Update enhanced siteMap with the actual subpage data
          enhancedSiteMap = {
            ...siteMap,
            pageInfoMap: {
              ...siteMap.pageInfoMap,
              [pageId]: subpageInfo
            }
          }
        }
      } catch (err) {
        console.error('[SocialImage API] Error fetching subpage:', err)
        // Fallback to slug-based title if fetch fails
        const slugTitle = parsedUrl.subpage?.slice(0, -36).replace(/-/g, ' ') || 'Untitled'
        enhancedSiteMap = {
          ...siteMap,
          pageInfoMap: {
            ...siteMap.pageInfoMap,
            [pageIdMatch[1]]: {
              title: slugTitle,
              pageId: pageIdMatch[1],
              type: 'Post' as const,
              slug: parsedUrl.subpage || pageIdMatch[1],
              parentPageId: null,
              childrenPageIds: [],
              language: null,
              public: true,
              useOriginalCoverImage: null,
              description: null,
              date: null,
              coverImage: undefined,
              children: []
            }
          }
        }
      }
    }

    // Let the SocialCard handle default backgrounds and page-specific cover images
    // Only provide imageUrl if explicitly requested via query parameter
    const explicitImageUrl = typeof _req.query.imageUrl === 'string' ? _req.query.imageUrl : undefined

    const browser = await getBrowser()
    const imageBuffer = await renderSocialImage(browser, {
      url: urlParam,
      imageUrl: explicitImageUrl,
      baseUrl,
      siteMap: enhancedSiteMap
    })


    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 's-maxage=0, stale-while-revalidate')
    res.status(200).end(imageBuffer)

  } catch (err) {
    console.error('[generate-social-image] Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    res.status(500).json({ 
      error: 'Failed to generate social image.',
      details: errorMessage
    })
  }
}

export default handler
