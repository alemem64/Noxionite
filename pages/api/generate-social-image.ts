import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const params = new URLSearchParams()
  const path =
    getQueryValue(req.query.path) || getQueryValue(req.query.url) || '/'
  const title = getQueryValue(req.query.title)
  const description = getQueryValue(req.query.description)

  params.set('path', path)
  if (title) params.set('title', title)
  if (description) params.set('description', description)

  res.redirect(307, `/api/og?${params.toString()}`)
}

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}
