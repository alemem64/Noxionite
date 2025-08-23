import { ImageResponse } from '@vercel/og';
import { SocialCard, SocialCardProps } from '@/components/SocialCard';
import { parseUrlPathname } from '@/lib/context/url-parser';
import { getCachedSiteMap } from '@/lib/context/site-cache';
import interSemiBold from '@/lib/fonts/inter-semibold';
import siteConfig from '../../site.config';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url || '', 'http://localhost');
    const path = searchParams.get('path') || '/';
    
    const parsed = parseUrlPathname(path);
    const siteMap = await getCachedSiteMap();
    
    const siteName = siteConfig.name;

    const fontData = await interSemiBold;

    let props: SocialCardProps;

    const defaultBg = `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
    const iconUrl = new URL('/icon.png', `https://${siteConfig.domain}`).toString();

    switch (parsed.segment) {
      case 'post': {
        let pageInfo = Object.values(siteMap.pageInfoMap).find(p => p.slug === parsed.slug);
        
        // If not found, try to find by checking if the slug might be different
        if (!pageInfo && parsed.slug) {
          // Try to find by title or other matching methods
          pageInfo = Object.values(siteMap.pageInfoMap).find(p => 
            p.slug === parsed.slug || 
            p.title?.toLowerCase().replace(/\s+/g, '-') === parsed.slug.toLowerCase() ||
            p.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === parsed.slug.toLowerCase()
          );
        }
        
        if (!pageInfo) {
          props = {
            type: 'root',
            title: siteName,
            backgroundImage: defaultBg,
            iconUrl,
          };
        } else {
          const author = siteConfig.authors?.find(a => pageInfo.authors?.includes(a.name));
          const authorInfo = author ? { name: author.name, avatarUrl: new URL(author.avatar_dir, `https://${siteConfig.domain}`).toString() } : undefined;

          props = {
            type: 'post',
            title: pageInfo.title,
            author: authorInfo,
            tags: pageInfo.tags,
            date: pageInfo.date ? new Date(pageInfo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : undefined,
            breadcrumb: [siteName, 'Post'],
            backgroundImage: pageInfo.coverImage || defaultBg,
          };
        }
        break;
      }
      case 'category': {
        const pageInfo = Object.values(siteMap.pageInfoMap).find(p => p.slug === parsed.slug && p.type === 'Category');
        if (!pageInfo) {
          props = {
            type: 'root',
            title: siteName,
            backgroundImage: defaultBg,
            iconUrl,
          };
        } else {
          props = {
            type: 'category',
            title: pageInfo.title,
            backgroundImage: pageInfo.coverImage || defaultBg,
            iconUrl,
          };
        }
        break;
      }
      case 'tag':
        props = {
          type: 'tag',
          title: `#${parsed.slug}`,
          backgroundImage: defaultBg,
          iconUrl,
        };
        break;
      case 'all-tags':
        props = {
          type: 'all-tags',
          title: 'All Tags',
          backgroundImage: defaultBg,
          iconUrl,
        };
        break;
      default: // root
        props = {
          type: 'root',
          title: siteName,
          backgroundImage: defaultBg,
          iconUrl,
        };
        break;
    }

    return new ImageResponse(
      (
        <SocialCard {...props} />
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 600,
          },
        ],
      }
    );
  } catch (err: any) {
    console.error('Failed to generate social image:', err);
    return new Response(`Failed to generate image: ${err.name}: ${err.message}`, { status: 500 });
  }
};

export default handler;
