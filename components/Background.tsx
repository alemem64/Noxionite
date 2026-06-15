import React, { useEffect, useRef, useState } from 'react'

import { useDarkMode } from '@/lib/use-dark-mode'

// --- Configuration ---
const DARK_MODE_OPACITY_RANGE = { min: 0.2, max: 0.9 }
const LIGHT_MODE_OPACITY_RANGE = { min: 0.2, max: 0.7 }
const BACKGROUND_ZOOM = 1.5
const BACKGROUND_VISIBLE_START = 0.25
const BACKGROUND_VISIBLE_END = 0.75

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  const result =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
  const B = Math.max(outMin, outMax)
  const A = Math.min(outMin, outMax)
  return Math.max(Math.min(result, B), A)
}

const getAverageLuminance = (imgSrc: string): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imgSrc
    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        return resolve(128) // Fallback to medium gray
      }
      canvas.width = 1
      canvas.height = 1
      ctx.drawImage(img, 0, 0, 1, 1)

      const imageData = ctx.getImageData(0, 0, 1, 1).data
      if (imageData && imageData.length >= 3) {
        const [r, g, b] = imageData
        if (
          typeof r === 'number' &&
          typeof g === 'number' &&
          typeof b === 'number'
        ) {
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
          resolve(luminance)
        } else {
          resolve(128)
        }
      } else {
        resolve(128) // Fallback on error
      }
    })
    img.addEventListener('error', () => {
      console.error(`Failed to load image: ${imgSrc}`)
      resolve(128) // Medium gray on error
    })
  })
}

interface BackgroundProps {
  source: HTMLImageElement | HTMLVideoElement | string | null
  scrollProgress?: number
}

function Background({ source, scrollProgress = 0 }: BackgroundProps) {
  const { isDarkMode } = useDarkMode()
  const [overlayOpacity, setOverlayOpacity] = useState(0.4)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null
  )
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const isElementSource =
    typeof Element !== 'undefined' && source instanceof Element

  // --- Opacity Calculation ---
  useEffect(() => {
    // Find and set default background image
    const findDefaultBackground = async () => {
      if (!source) {
        try {
          const { detectBestBackgroundFormat } = await import(
            '@/lib/get-default-background'
          )
          const bestFormat = await detectBestBackgroundFormat()
          setBackgroundImageUrl(bestFormat)
        } catch {
          const { getDefaultBackgroundUrl } = await import(
            '@/lib/get-default-background'
          )
          setBackgroundImageUrl(getDefaultBackgroundUrl())
        }
      } else {
        setBackgroundImageUrl(null) // Use provided source
      }
    }

    void findDefaultBackground()
  }, [source])

  useEffect(() => {
    if (typeof source === 'string') {
      let isMounted = true
      const calculateAndSetOpacity = async () => {
        const luminance = await getAverageLuminance(source)
        if (!isMounted) return

        let newOpacity: number
        if (isDarkMode) {
          newOpacity = mapRange(
            luminance,
            0,
            255,
            DARK_MODE_OPACITY_RANGE.min,
            DARK_MODE_OPACITY_RANGE.max
          )
        } else {
          newOpacity = mapRange(
            luminance,
            0,
            255,
            LIGHT_MODE_OPACITY_RANGE.max,
            LIGHT_MODE_OPACITY_RANGE.min
          )
        }
        setOverlayOpacity(newOpacity)
      }
      void calculateAndSetOpacity()
      return () => {
        isMounted = false
      }
    } else if (backgroundImageUrl && !source) {
      // Calculate opacity for default background
      let isMounted = true
      const calculateAndSetOpacity = async () => {
        const luminance = await getAverageLuminance(backgroundImageUrl)
        if (!isMounted) return

        let newOpacity: number
        if (isDarkMode) {
          newOpacity = mapRange(
            luminance,
            0,
            255,
            DARK_MODE_OPACITY_RANGE.min,
            DARK_MODE_OPACITY_RANGE.max
          )
        } else {
          newOpacity = mapRange(
            luminance,
            0,
            255,
            LIGHT_MODE_OPACITY_RANGE.max,
            LIGHT_MODE_OPACITY_RANGE.min
          )
        }
        setOverlayOpacity(newOpacity)
      }
      void calculateAndSetOpacity()
      return () => {
        isMounted = false
      }
    } else {
      setOverlayOpacity(0.4) // Default for video/element-based backgrounds
    }
  }, [source, backgroundImageUrl, isDarkMode])

  // --- Canvas Drawing Logic (for Hero) ---
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!isElementSource || !ctx || !source) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const draw = () => {
      if (!canvas || !source || !ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const mediaWidth =
        source instanceof HTMLVideoElement
          ? source.videoWidth
          : source.naturalWidth
      const mediaHeight =
        source instanceof HTMLVideoElement
          ? source.videoHeight
          : source.naturalHeight

      if (mediaWidth > 0 && mediaHeight > 0) {
        const canvasAspectRatio = canvas.width / canvas.height
        const mediaAspectRatio = mediaWidth / mediaHeight
        let drawWidth = 0,
          drawHeight = 0,
          x = 0,
          y = 0

        if (canvasAspectRatio > mediaAspectRatio) {
          drawWidth = canvas.width
          drawHeight = canvas.width / mediaAspectRatio
        } else {
          drawHeight = canvas.height
          drawWidth = canvas.height * mediaAspectRatio
        }

        x = (canvas.width - drawWidth) / 2
        y = (canvas.height - drawHeight) / 2

        ctx.drawImage(source, x, y, drawWidth, drawHeight)
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isElementSource, source])

  // --- Zoom and Scroll-panning Logic (for both Canvas and Div) ---
  useEffect(() => {
    const element = isElementSource ? canvasRef.current : backgroundRef.current
    if (element) {
      const vh = window.innerHeight
      const movableDistance = vh * (BACKGROUND_ZOOM - 1)

      const fullRangeTop = movableDistance / 2
      const fullRangeBottom = -movableDistance / 2

      const startTranslateY =
        fullRangeTop +
        (fullRangeBottom - fullRangeTop) * BACKGROUND_VISIBLE_START
      const endTranslateY =
        fullRangeTop + (fullRangeBottom - fullRangeTop) * BACKGROUND_VISIBLE_END

      // Invert the scroll direction
      const newTranslateY =
        (endTranslateY + scrollProgress * (startTranslateY - endTranslateY)) *
        -1

      element.style.transform = `scale(${BACKGROUND_ZOOM}) translateY(${newTranslateY}px)`
    }
  }, [scrollProgress, isElementSource, source])

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100vh',
    transition: 'transform 0.3s ease-out'
  }

  const blurredStyle: React.CSSProperties = {
    ...baseStyle,
    objectFit: 'cover',
    filter: 'blur(var(--blur-bg-size))',
    WebkitFilter: 'blur(var(--blur-bg-size))' // For iOS Safari
  }

  return (
    <div
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        overflow: 'hidden'
      }}
    >
      {isElementSource ? (
        <canvas ref={canvasRef} style={blurredStyle} />
      ) : (
        <div
          ref={backgroundRef}
          style={{
            ...blurredStyle,
            backgroundImage: `url(${source || backgroundImageUrl || '/default_background.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode
            ? `rgba(0, 0, 0, ${overlayOpacity})`
            : `rgba(255, 255, 255, ${overlayOpacity})`,
          transition: 'background-color 0.5s ease'
        }}
      />
    </div>
  )
}

export default Background
