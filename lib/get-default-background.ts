export const getDefaultBackgroundUrl = (): string => {

  return '/default_background.png'
}

export const getSupportedBackgroundFormats = (): string[] => {
  return ['png']
}

export const detectBestBackgroundFormat = async (): Promise<string> => {
  const supportedFormats = getSupportedBackgroundFormats()
  const basePath = '/default_background'
  
  // Try loading images in order of preference (webp first for performance)
  const tryLoadImage = (format: string): Promise<string | null> => {
    return new Promise((resolve) => {
            if (typeof window === 'undefined') {
        // Server-side: return webp as default
        resolve(null)
        return
      }
      
      const img = new Image()
      img.addEventListener('load', () => resolve(`${basePath}.${format}`))
      img.addEventListener('error', () => resolve(null))
      img.src = `${basePath}.${format}`
    })
  }

  try {
    const results = await Promise.all(supportedFormats.map(tryLoadImage))
    const foundImage = results.find(url => url !== null)
    return foundImage || getDefaultBackgroundUrl()
  } catch {
    return getDefaultBackgroundUrl()
  }
}
