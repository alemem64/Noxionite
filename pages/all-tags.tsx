import { site } from '@/lib/config'
import { getCachedSiteMap } from '@/lib/context/site-cache'
import { serializeSiteMapForPage } from '@/lib/context/client-site-map'
import type { PageProps } from '@/lib/context/types'
import { TagList } from '@/components/TagList'
import styles from '@/styles/components/all-tags.module.css'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../next-i18next.config.cjs'
import { useTranslation } from 'next-i18next'

export const getStaticProps = async ({ locale }: { locale: string }) => {
  const siteMap = await getCachedSiteMap()
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ['common', 'languages'],
        nextI18NextConfig
      )),
      site,
      siteMap: serializeSiteMapForPage(siteMap, locale),
      pageId: 'all-tags'
    }
  }
}

export default function AllTagsPage({ siteMap }: PageProps) {
  const { t } = useTranslation('common')
  if (!siteMap) {
    return null
  }
  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('allTags')}</h1>
        <TagList />
      </div>
    </>
  )
}
