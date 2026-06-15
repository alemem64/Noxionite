import * as React from 'react'
import { graphControl } from '@/components/graph/utils/graph-control'

// Full-featured debug controls for testing graph functionality
export function GraphController() {
  const [slugInput, setSlugInput] = React.useState('')
  const [tagInput, setTagInput] = React.useState('')

  const handleSlugFocus = () => {
    if (slugInput.trim()) {
      const slugs = slugInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      graphControl.changeViewAndFocusBySlug('post_view', slugs, 'sidenav')
    }
  }

  const handleTagFocus = () => {
    if (tagInput.trim()) {
      const tags = tagInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      graphControl.changeViewAndFocusNode('tag_view', tags, 'sidenav')
    }
  }

  const handleSlugHighlight = () => {
    if (slugInput.trim()) {
      const slugs = slugInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      graphControl.highlightBySlug(slugs, 'sidenav')
    }
  }

  const handleTagHighlight = () => {
    if (tagInput.trim()) {
      const tags = tagInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      graphControl.highlightByTag(tags, 'sidenav')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px'
      }}
    >
      <div>
        <strong>Graph Debug Controls:</strong>
      </div>

      <div style={{ marginTop: '8px' }}>
        <div>Basic Controls:</div>
        <button
          onClick={() => graphControl.fitToHome('sidenav')}
          style={{ margin: '2px', padding: '2px 4px', fontSize: '10px' }}
        >
          Fit Home
        </button>
        <button
          onClick={() => graphControl.changeView('post_view', 'sidenav')}
          style={{ margin: '2px', padding: '2px 4px', fontSize: '10px' }}
        >
          Post View
        </button>
        <button
          onClick={() => graphControl.changeView('tag_view', 'sidenav')}
          style={{ margin: '2px', padding: '2px 4px', fontSize: '10px' }}
        >
          Tag View
        </button>
      </div>

      <div style={{ marginTop: '8px' }}>
        <div>Slug Input (Post/Category):</div>
        <input
          type='text'
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value)}
          placeholder='Enter slug(s), comma-separated...'
          style={{
            width: '120px',
            fontSize: '10px',
            padding: '2px',
            marginRight: '2px',
            background: '#333',
            color: 'white',
            border: '1px solid #555'
          }}
        />
        <button
          onClick={handleSlugFocus}
          style={{ margin: '2px', padding: '2px 4px', fontSize: '10px' }}
        >
          Focus Slug
        </button>
        <button
          onClick={handleSlugHighlight}
          style={{
            margin: '2px',
            padding: '2px 4px',
            fontSize: '10px',
            backgroundColor: '#ff9800'
          }}
        >
          Highlight Slug
        </button>
      </div>

      <div style={{ marginTop: '8px' }}>
        <div>Tag Input:</div>
        <input
          type='text'
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder='Enter tag(s), comma-separated...'
          style={{
            width: '120px',
            fontSize: '10px',
            padding: '2px',
            marginRight: '2px',
            background: '#333',
            color: 'white',
            border: '1px solid #555'
          }}
        />
        <button
          onClick={handleTagFocus}
          style={{ margin: '2px', padding: '2px 4px', fontSize: '10px' }}
        >
          Focus Tag
        </button>
        <button
          onClick={handleTagHighlight}
          style={{
            margin: '2px',
            padding: '2px 4px',
            fontSize: '10px',
            backgroundColor: '#ff9800'
          }}
        >
          Highlight Tag
        </button>
        <button
          onClick={() => graphControl.clearHighlight('sidenav')}
          style={{
            margin: '2px',
            padding: '2px 4px',
            fontSize: '10px',
            backgroundColor: '#f44336'
          }}
        >
          Clear Highlights
        </button>
      </div>

      <div style={{ marginTop: '8px' }}>
        <button
          onClick={() => {
            const path = window.location.pathname

            graphControl.handleUrlCurrentFocus(path, 'sidenav')
          }}
          style={{ margin: '2px', padding: '2px 4px', fontSize: '10px' }}
        >
          Test Current URL
        </button>
      </div>

      <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
        <div>Usage:</div>
        <div>
          • Slug: post slug or category slug (comma-separated for multiple)
        </div>
        <div>• Tag: exact tag name (comma-separated for multiple)</div>
        <div>• Check console for logs</div>
      </div>
    </div>
  )
}
