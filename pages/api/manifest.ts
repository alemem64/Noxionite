import { NextApiRequest, NextApiResponse } from 'next'
import { siteConfig } from '../../lib/site-config'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const manifest = {
    name: siteConfig.name,
    short_name: siteConfig.name.split(' ').slice(0, 2).join(' '),
    icons: [
      {
        src: '/icon.png',
        type: 'image/png',
        sizes: '512x512'
      },
      {
        src: '/icon-192.png',
        type: 'image/png',
        sizes: '192x192'
      }
    ],
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone'
  }

  res.setHeader('Content-Type', 'application/manifest+json')
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=86400'
  )
  res.json(manifest)
}
