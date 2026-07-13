import type { NextApiRequest, NextApiResponse } from 'next'

import { getSocialImageUrl } from '@/lib/get-social-image-url'

// 하위 호환 shim: 구 URL로 들어온 요청을 빌드 시 생성된 정적 OG 이미지로 보낸다.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const path =
    getQueryValue(req.query.path) || getQueryValue(req.query.url) || '/'

  res.redirect(307, getSocialImageUrl(path))
}

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}
