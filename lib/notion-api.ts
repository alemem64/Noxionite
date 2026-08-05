import { NotionAPI } from 'notion-client'
import type { ExtendedRecordMap } from 'notion-types'

const notionUserAgent = process.env.NOTION_API_USER_AGENT || 'Noxionite/1.0'

type RecordMapLike = Partial<
  ExtendedRecordMap & {
    team?: Record<string, unknown>
    space?: Record<string, unknown>
  }
>

function normalizeMapBox(mapBox: any) {
  if (!mapBox?.value) {
    return mapBox
  }

  let value = mapBox.value
  while (value?.value) {
    value = value.value
  }

  if (!value?.id) {
    return mapBox
  }

  return {
    ...mapBox,
    value
  }
}

function normalizeRecordMap<T extends RecordMapLike | undefined>(
  recordMap: T
): T {
  if (!recordMap) {
    return recordMap
  }

  for (const table of [
    'block',
    'collection',
    'collection_view',
    'notion_user',
    'space',
    'team'
  ] as const) {
    const tableMap = recordMap[table]
    if (!tableMap || typeof tableMap !== 'object') {
      continue
    }

    for (const [id, mapBox] of Object.entries(tableMap)) {
      ;(tableMap as Record<string, unknown>)[id] = normalizeMapBox(mapBox)
    }
  }

  return recordMap
}

function normalizeRecordMapResponse<T extends { recordMap?: RecordMapLike }>(
  response: T
): T {
  normalizeRecordMap(response?.recordMap)
  return response
}

class NoxioniteNotionAPI extends NotionAPI {
  override async getPage(...args: Parameters<NotionAPI['getPage']>) {
    const recordMap = await super.getPage(...args)
    return normalizeRecordMap(recordMap)
  }

  override async getBlocks(...args: Parameters<NotionAPI['getBlocks']>) {
    const response = await super.getBlocks(...args)
    return normalizeRecordMapResponse(response)
  }

  override async getCollectionData(
    ...args: Parameters<NotionAPI['getCollectionData']>
  ) {
    const response = await super.getCollectionData(...args)
    return normalizeRecordMapResponse(response)
  }

  override async search(...args: Parameters<NotionAPI['search']>) {
    const response = await super.search(...args)
    return normalizeRecordMapResponse(response)
  }
}

export const notion = new NoxioniteNotionAPI({
  authToken: process.env.NOTION_TOKEN_V2,
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  ofetchOptions: {
    headers: {
      'User-Agent': notionUserAgent
    }
  }
})
