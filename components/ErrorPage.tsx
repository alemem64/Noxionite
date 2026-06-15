import * as React from 'react'
import { useRouter } from 'next/router'
import styles from 'styles/components/common.module.css'
import { useTranslation } from 'next-i18next'

import type { Site } from '@/lib/context/types'

import { PageHead } from './PageHead'

interface ErrorPageProps {
  statusCode: number
  site?: Site
}

export function ErrorPage({ statusCode, site }: ErrorPageProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const title =
    statusCode === 404 ? t('error.404.title') : t('error.default.title')
  const description =
    statusCode === 404
      ? t('error.404.description')
      : t('error.default.description')

  return (
    <>
      <PageHead
        site={site}
        title={title}
        url={`/${router.locale}${router.asPath === '/' ? '' : router.asPath}`}
      />
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorTitle}>{title}</h1>
          <p className={styles.errorDescription}>{description}</p>
        </div>
      </div>
    </>
  )
}
