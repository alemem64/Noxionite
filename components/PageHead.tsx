import Head from 'next/head'

import type * as types from '@/lib/context/types'
import * as config from '@/lib/config'
import { getSocialImageUrl } from '@/lib/get-social-image-url'
import { absoluteUrl } from '@/lib/seo'

export function PageHead({
  site,
  title,
  description,
  image,
  url
}: Partial<types.PageProps> & {
  title?: string
  description?: string
  image?: string
  url?: string
}) {
  const canonicalUrl = absoluteUrl(url || '/')
  const socialImageUrl = absoluteUrl(image || getSocialImageUrl(url || '/'))
  const rssFeedUrl = absoluteUrl('/feed')
  const pageType = url?.includes('/post/') ? 'article' : 'website'

  title = title || site?.name || config.name
  description = description || site?.description || config.description

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
      />

      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='black' />

      <meta
        name='theme-color'
        media='(prefers-color-scheme: light)'
        content='#fefffe'
        key='theme-color-light'
      />
      <meta
        name='theme-color'
        media='(prefers-color-scheme: dark)'
        content='#2d3439'
        key='theme-color-dark'
      />

      <meta name='robots' content='index,follow,max-image-preview:large' />
      <meta property='og:type' content={pageType} />

      {config.dnsRecord && (
        <meta name='google-site-verification' content={config.dnsRecord} />
      )}

      {site && (
        <>
          <meta property='og:site_name' content={site.name} />
          <meta name='twitter:domain' content={site.domain} />
        </>
      )}

      {description && (
        <>
          <meta name='description' content={description} />
          <meta property='og:description' content={description} />
          <meta name='twitter:description' content={description} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta name='twitter:image:alt' content={title} />
          <meta property='og:image' content={socialImageUrl} />
          <meta property='og:image:secure_url' content={socialImageUrl} />
          <meta property='og:image:width' content='1200' />
          <meta property='og:image:height' content='630' />
          <meta property='og:image:type' content='image/jpeg' />
          <meta property='og:image:alt' content={title} />
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {canonicalUrl && (
        <>
          <link rel='canonical' href={canonicalUrl} />
          <meta property='og:url' content={canonicalUrl} />
          <meta name='twitter:url' content={canonicalUrl} />
        </>
      )}

      {rssFeedUrl && (
        <link
          rel='alternate'
          type='application/rss+xml'
          href={rssFeedUrl}
          title={site?.name}
        />
      )}

      <meta property='og:title' content={title} />
      <meta name='twitter:title' content={title} />
      <title>{title}</title>
    </Head>
  )
}
