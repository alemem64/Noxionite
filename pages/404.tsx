import { ErrorPage } from '@/components/ErrorPage'
import * as React from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18NextConfig from '../next-i18next.config.cjs'
import { site } from '@/lib/config'

import type { PageProps } from '@/lib/context/types'

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ['common', 'languages'],
        nextI18NextConfig
      )),
      site
    }
  }
}

export default function Page404({ site }: PageProps) {
  return (
    <>
      <ErrorPage site={site} statusCode={404} />
    </>
  )
}
