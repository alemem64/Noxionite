import * as React from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image';

// Debounce function to limit API calls
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor)
    })
}

export function SocialImagePreviewer() {
  const router = useRouter()
  const [path, setPath] = React.useState(router.asPath)
  const [previewUrl, setPreviewUrl] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const generatePreview = React.useCallback(async (currentPath: string) => {
    if (!currentPath.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/generate-social-image.tsx?path=${encodeURIComponent(currentPath)}`);
      
      if (!response.ok) {
        // Handle JSON error responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setError(data.error || 'Failed to generate preview');
        } else {
          setError(`HTTP ${response.status}: ${response.statusText}`);
        }
        return;
      }

      // Convert JPEG response to blob URL for image display
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setPreviewUrl(imageUrl);
    } catch (err) {
      console.error('Error fetching preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [])

  const debouncedGenerate = React.useMemo(() => debounce(generatePreview, 500), [generatePreview]);

  // Update path when route changes
  React.useEffect(() => {
    setPath(router.asPath)
    void debouncedGenerate(router.asPath)
  }, [router.asPath, debouncedGenerate])

  const [isOpen, setIsOpen] = React.useState(true)

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 9998,
          padding: '10px 15px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        🎨 Show Social Preview
      </button>
    )
  }

  return (
    <div 
      key={router.asPath} 
      style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '40px',
      overflowY: 'auto',
      backdropFilter: 'blur(10px)',
    }}>
      <button 
        onClick={() => setIsOpen(false)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '50px',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Close
      </button>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px' }}>Social Image Preview</h2>
        
        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '600px', margin: '0 auto 20px' }}>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generatePreview(path)}
            placeholder="Enter path (e.g. /)"
            style={{ flexGrow: 1, padding: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
          />
          <button
            onClick={() => generatePreview(path)}
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: loading ? '#666' : '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Rendered Image Preview */}
        <div>
          <h3 style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>Rendered JPEG Preview (Scaled)</h3>
          <div style={{ maxWidth: '1200px', margin: '0 auto', aspectRatio: '1200 / 630', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>}
            {previewUrl && !error && (
              <Image 
                src={previewUrl} 
                alt="Social card preview" 
                width={1200}
                height={630}
                style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
                priority
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
