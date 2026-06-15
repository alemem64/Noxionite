export const GRAPH_CONFIG = {
  // Visual styling
  visual: {
    HOME_NODE_SIZE: 16,
    CATEGORY_NODE_SIZE: 10,
    DB_NODE_SIZE: 12,
    POST_NODE_SIZE: 4,
    NODE_INNER_BORDER_WIDTH: 0.3,
    NODE_OUTER_BORDER_WIDTH: 0.3,
    HOME_CORNER_RADIUS: 16,
    CATEGORY_CORNER_RADIUS: 2,
    DB_CORNER_RADIUS: 2,
    LINK_WIDTH: 0.1,
    HOVER_OPACITY: 0.1,
    HOME_NAME_FONT_SIZE: 4,
    CATEGORY_FONT_SIZE: 2,
    DB_NAME_FONT_SIZE: 3,
    POST_FONT_SIZE: 1,
    TAG_NAME_FONT_SIZE: 2,
    GLOW_SIZE_MULTIPLIER: 20, // pixels for zoom-independent glow size
    GLOW_OPACITY: 0.6,
    GLOW_MIN_OFFSET_SIZE: 2 // offset added to node size for minimum glow size
  },

  // Zoom configuration
  zoom: {
    HOME_NODE_ZOOM: 3,
    CATEGORY_NODE_ZOOM: 5,
    POST_NODE_ZOOM: 10,
    TAG_NODE_ZOOM: 8,
    BASE_NODE_SIZE: 4,
    DEFAULT_PADDING: 200,
    ANIMATION_DURATION: 400,
    MULTIPLE_ZOOM_RATIO: 1.0
  },

  // Physics engine
  physics: {
    post: {
      cooldownTicks: 100,
      warmupTicks: 50,
      d3AlphaDecay: 0.02,
      d3VelocityDecay: 0.3,
      linkDistance: 30,
      linkStrength: 1,
      nodeRepulsion: 15
    },
    tag: {
      cooldownTicks: 100,
      warmupTicks: 50,
      d3AlphaDecay: 0.025,
      d3VelocityDecay: 0.4,
      linkDistance: 60,
      linkStrength: 0.7,
      nodeRepulsion: 50
    }
  },

  // Performance
  performance: {
    maxNodes: 1000,
    maxLinks: 2000,
    debounceDelay: 16, // ~60fps
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    focusFrequency: 200, // Focus retry interval in ms during physics engine operation
    focusTry: 5 // maximum number of focus retry attempts
  },

  // Responsive breakpoints
  responsive: {
    sidenav: { width: 300, height: 300 },
    fullscreen: { minWidth: 400, minHeight: 400 },
    home: { width: 800, height: 600 }
  }
} as const

export const HOME_NODE_ID = '__HOME__'
export const ALL_TAGS_NODE_ID = '__ALL_TAGS__'

// Color schemes for different themes with glassmorphism
export const GRAPH_COLORS = {
  light: {
    link: 'rgba(0, 0, 0, 0.3)',
    text: 'rgb(50, 48, 44)',
    highlight: '#f59e0b',
    node: 'rgba(255, 255, 255, 0.25)',
    nodeInnerBorder: 'rgba(255, 255, 255, 0.18)',
    nodeOuterBorder: 'rgba(0, 0, 0, 0.1)',
    nodeHighlightOuterBorder: 'rgba(0, 0, 0, 0.5)',
    nodeGlow: 'rgba(23, 77, 255, 0.8)',
    nodeGlowEnd: 'rgba(23, 77, 255, 0)'
  },
  dark: {
    link: 'rgba(255, 255, 255, 0.2)',
    text: 'rgba(255, 255, 255, 0.9)',
    highlight: '#fbbf24',
    node: 'rgba(0, 0, 0, 0.3)',
    nodeInnerBorder: 'rgba(0, 0, 0, 0.3)',
    nodeOuterBorder: 'rgba(255, 255, 255, 0.1)',
    nodeHighlightOuterBorder: 'rgba(255, 255, 255, 0.5)',
    nodeGlow: 'rgba(23, 77, 255, 0.8)',
    nodeGlowEnd: 'rgba(23, 77, 255, 0)'
  }
}
