import cs from 'classnames'
import Image from 'next/image'
import * as React from 'react'
import styles from 'styles/components/common.module.css'

import * as config from '@/lib/config'

import { PageSocial } from './PageSocial'
import ShinyText from './react-bits/ShinyText'

export function FooterImpl({ isMobile }: { isMobile: boolean }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div
        className={cs(
          styles.footerContent,
          !isMobile && styles.footerContentWithSideNav
        )}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 1rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <div
              className={styles.copyright}
              style={{ order: isMobile ? 2 : 1 }}
            >
              Copyright {currentYear} {config.author}
            </div>
            <div style={{ order: isMobile ? 1 : 2 }}>
              <PageSocial />
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '0.875rem',
              order: 3
            }}
          >
            <a
              href='https://noxionite.vercel.app'
              target='_blank'
              rel='noopener noreferrer'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer'
              }}
            >
              <span>Powered by</span>
              <Image
                src='/Noxionite-icon.png'
                alt='Noxionite'
                width={16}
                height={16}
                style={{
                  margin: '0 4px 0 8px'
                }}
              />
              <ShinyText text='Noxionite' speed={3} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
