import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaTags } from 'react-icons/fa'
import { MdError } from 'react-icons/md'
import type * as types from '@/lib/context/types'
import siteConfig from '../site.config'

interface BreadcrumbItem {
  title: string
  pageInfo?: types.PageInfo
  href?: string
}

interface BreadcrumbProps {
  breadcrumbs: BreadcrumbItem[]
  isMobile?: boolean
  pathname: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  breadcrumbs,
  isMobile,
  pathname
}) => {
  if (isMobile) {
    return (
      <Link href='/' className='breadcrumb-item active'>
        <span className='breadcrumb-icon'>
          <Image
            src='/icon.png'
            alt='Site Icon'
            className='site-icon'
            width={16}
            height={16}
          />
        </span>
        <span className='breadcrumb-text'>{siteConfig.name}</span>
      </Link>
    )
  }

  return (
    <>
      {breadcrumbs.map((crumb, index) => {
        const isLastCrumb = index === breadcrumbs.length - 1
        const isFirstCrumb = index === 0

        return (
          <React.Fragment key={index}>
            {!isFirstCrumb && <span className='breadcrumb-separator'>›</span>}
            {isLastCrumb || !crumb.href ? (
              <span className='breadcrumb-item active'>
                {isFirstCrumb ? (
                  <>
                    <span className='breadcrumb-icon'>
                      <Image
                        src='/icon.png'
                        alt='Site Icon'
                        className='site-icon'
                        width={16}
                        height={16}
                      />
                    </span>
                    <span className='breadcrumb-text'>{crumb.title}</span>
                  </>
                ) : (index === 1 && pathname.startsWith('/tag/')) ||
                  (index === 1 && pathname === '/all-tags') ? (
                  <>
                    <FaTags className='breadcrumb-icon-inline' />
                    <span className='breadcrumb-text'>{crumb.title}</span>
                  </>
                ) : pathname === '/404' && index === 1 ? (
                  <>
                    <MdError className='breadcrumb-icon-inline' />
                    <span className='breadcrumb-text'>{crumb.title}</span>
                  </>
                ) : (
                  <span className='breadcrumb-text'>{crumb.title}</span>
                )}
              </span>
            ) : (
              <Link href={crumb.href} className='breadcrumb-item'>
                {isFirstCrumb ? (
                  <>
                    <span className='breadcrumb-icon'>
                      <Image
                        src='/icon.png'
                        alt='Site Icon'
                        className='site-icon'
                        width={16}
                        height={16}
                      />
                    </span>
                    <span className='breadcrumb-text'>{crumb.title}</span>
                  </>
                ) : (index === 1 && pathname.startsWith('/tag/')) ||
                  (index === 1 && pathname === '/all-tags') ? (
                  <>
                    <FaTags className='breadcrumb-icon-inline' />
                    <span className='breadcrumb-text'>{crumb.title}</span>
                  </>
                ) : pathname === '/404' && index === 1 ? (
                  <>
                    <MdError className='breadcrumb-icon-inline' />
                    <span className='breadcrumb-text'>{crumb.title}</span>
                  </>
                ) : (
                  <span className='breadcrumb-text'>{crumb.title}</span>
                )}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
