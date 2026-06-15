import { getSiteMap } from '@/lib/context/get-site-map'
import type { PageProps } from '@/lib/context/types'
import { TagList } from '@/components/TagList'
import styles from '@/styles/components/all-tags.module.css'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../next-i18next.config.cjs'
import { useTranslation } from 'next-i18next'
import { site } from '@/lib/config'

export const getStaticProps = async ({ locale }: { locale: string }) => {
  const siteMap = await getSiteMap()
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ['common', 'languages'],
        nextI18NextConfig
      )),
      site,
      siteMap,
      pageId: 'all-tags'
    },
    revalidate: 10
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
