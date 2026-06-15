import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface PageHeadInfo {
  title: string
  description: string
  image: string
  url: string
  ogType: string
  siteName: string
  twitterCard: string
  twitterDomain: string
  canonical: string
  rssFeed: string
}

export function PageHeadPreviewer() {
  const [headInfo, setHeadInfo] = useState<PageHeadInfo | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const updateHeadInfo = () => {
      const head = document.querySelector('head')
      if (!head) return

      const metaTags = Array.from(head.querySelectorAll('meta'))
      const titleTag = head.querySelector('title')
      const linkTags = Array.from(head.querySelectorAll('link'))

      const info: PageHeadInfo = {
        title: titleTag?.textContent || '',
        description:
          metaTags
            .find((tag) => tag.getAttribute('name') === 'description')
            ?.getAttribute('content') || '',
        image:
          metaTags
            .find(
              (tag) =>
                tag.getAttribute('property') === 'og:image' ||
                tag.getAttribute('name') === 'twitter:image'
            )
            ?.getAttribute('content') || '',
        url:
          metaTags
            .find((tag) => tag.getAttribute('property') === 'og:url')
            ?.getAttribute('content') || window.location.href,
        ogType:
          metaTags
            .find((tag) => tag.getAttribute('property') === 'og:type')
            ?.getAttribute('content') || 'website',
        siteName:
          metaTags
            .find((tag) => tag.getAttribute('property') === 'og:site_name')
            ?.getAttribute('content') || '',
        twitterCard:
          metaTags
            .find((tag) => tag.getAttribute('name') === 'twitter:card')
            ?.getAttribute('content') || '',
        twitterDomain:
          metaTags
            .find((tag) => tag.getAttribute('name') === 'twitter:domain')
            ?.getAttribute('content') || '',
        canonical:
          linkTags
            .find((tag) => tag.getAttribute('rel') === 'canonical')
            ?.getAttribute('href') || '',
        rssFeed:
          linkTags
            .find((tag) => tag.getAttribute('type') === 'application/rss+xml')
            ?.getAttribute('href') || ''
      }

      setHeadInfo(info)
    }

    updateHeadInfo()

    const observer = new MutationObserver(updateHeadInfo)
    const head = document.querySelector('head')
    if (head) {
      observer.observe(head, { childList: true, subtree: true })
    }

    return () => observer.disconnect()
  }, [])

  if (!headInfo) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          padding: '10px 20px',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          📊 Head Info
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            color: 'white',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxWidth: '500px',
            maxHeight: '70vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '14px' }}>
              Page Head Information
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <div>
              <strong>Title:</strong>
              <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                {headInfo.title || 'N/A'}
              </div>
            </div>

            <div>
              <strong>Description:</strong>
              <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                {headInfo.description || 'N/A'}
              </div>
            </div>

            <div>
              <strong>OG Image:</strong>
              {headInfo.image ? (
                <div style={{ marginTop: '4px' }}>
                  <Image
                    src={headInfo.image}
                    alt='OG'
                    width={200}
                    height={100}
                    style={{ borderRadius: '4px', objectFit: 'cover' }}
                    unoptimized
                  />
                  <div
                    style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {headInfo.image}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '4px' }}>N/A</div>
              )}
            </div>

            <div>
              <strong>URL:</strong>
              <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                {headInfo.url}
              </div>
            </div>

            <div>
              <strong>Canonical:</strong>
              <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                {headInfo.canonical || 'N/A'}
              </div>
            </div>

            <div>
              <strong>Site Name:</strong>
              <div style={{ marginTop: '4px' }}>
                {headInfo.siteName || 'N/A'}
              </div>
            </div>

            <div>
              <strong>OG Type:</strong>
              <div style={{ marginTop: '4px' }}>{headInfo.ogType}</div>
            </div>

            <div>
              <strong>Twitter Card:</strong>
              <div style={{ marginTop: '4px' }}>{headInfo.twitterCard}</div>
            </div>

            <div>
              <strong>Twitter Domain:</strong>
              <div style={{ marginTop: '4px' }}>
                {headInfo.twitterDomain || 'N/A'}
              </div>
            </div>

            <div>
              <strong>RSS Feed:</strong>
              <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                {headInfo.rssFeed || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
