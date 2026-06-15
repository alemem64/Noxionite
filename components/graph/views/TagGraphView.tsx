import React, { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useGraphContext } from '../GraphProvider'
import { useDarkMode } from '@/lib/use-dark-mode'
import { GRAPH_CONFIG, GRAPH_COLORS } from '../utils/graphConfig'
import { graphControl } from '../utils/graph-control'
import type { GraphNode } from '../types/graph.types'

const ForceGraphWrapper = dynamic(() => import('../ForceGraphWrapper'), {
  ssr: false,
  loading: () => <div>Loading tag graph...</div>
})

interface TagGraphViewProps {
  width?: number
  height?: number
  className?: string
  currentTag?: string
}

export const TagGraphView: React.FC<TagGraphViewProps> = ({
  width,
  height,
  className = '',
  currentTag
}) => {
  const router = useRouter()
  const { state, actions, data, instance } = useGraphContext()
  const { isDarkMode } = useDarkMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: width || GRAPH_CONFIG.responsive.sidenav.width,
    height: height || GRAPH_CONFIG.responsive.sidenav.height
  })
  const [isDimensionsReady, setIsDimensionsReady] = useState(false)

  const { tagGraphData } = data
  const { graphRef, setGraphInstance } = instance
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(
    new Set()
  )
  const [highlightedLinks, setHighlightedLinks] = useState<Set<any>>(new Set())
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false)

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (state.isModalOpen) {
        actions.closeModal()
      }

      if (node.url && node.url !== '#') {
        void router.push(node.url)
      }
    },
    [router, actions, state.isModalOpen]
  )

  useEffect(() => {
    if (
      state.isGraphLoaded &&
      graphRef.current &&
      state.currentView === 'tag_view' &&
      isDimensionsReady
    ) {
      if (currentTag) {
        actions.zoomToNode(currentTag, 400)
      } else {
        actions.applyCurrentZoom(true) // Force fit to new dimensions
      }
    }
  }, [currentTag, state.currentView, state.isGraphLoaded, isDimensionsReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      if (!isMouseInCanvas) return

      setHoveredNode(node)

      const newHighlightedNodeIds = new Set<string>()
      const newHighlightedLinks = new Set<any>()

      if (node) {
        newHighlightedNodeIds.add(node.id as string)
        tagGraphData?.links.forEach((link) => {
          const sourceId =
            typeof link.source === 'string'
              ? link.source
              : (link.source as GraphNode)?.id
          const targetId =
            typeof link.target === 'string'
              ? link.target
              : (link.target as GraphNode)?.id

          if (sourceId === node.id) {
            newHighlightedNodeIds.add(targetId as string)
            newHighlightedLinks.add(link)
          }
          if (targetId === node.id) {
            newHighlightedNodeIds.add(sourceId as string)
            newHighlightedLinks.add(link)
          }
        })
      }

      setHighlightedNodeIds(newHighlightedNodeIds)
      setHighlightedLinks(newHighlightedLinks)
    },
    [tagGraphData, isMouseInCanvas]
  )

  const handleMouseEnterCanvas = useCallback(() => {
    setIsMouseInCanvas(true)
  }, [])

  const handleMouseLeaveCanvas = useCallback(() => {
    setIsMouseInCanvas(false)
    setHoveredNode(null)
    setHighlightedNodeIds(new Set())
    setHighlightedLinks(new Set())
  }, [])

  const handleZoomEnd = useCallback(() => {
    actions.saveCurrentZoom()
  }, [actions])

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Skip rendering if coordinates are invalid
      if (node.x == null || node.y == null || isNaN(node.x) || isNaN(node.y)) {
        return
      }

      const colors = isDarkMode ? GRAPH_COLORS.dark : GRAPH_COLORS.light
      const isCurrentTag = currentTag === node.id
      const isTagHighlighted =
        state.highlightTags.length > 0 &&
        state.highlightTags.includes(node.id as string)
      ctx.globalAlpha =
        !hoveredNode || highlightedNodeIds.has(node.id as string)
          ? 1
          : GRAPH_CONFIG.visual.HOVER_OPACITY
      const label = node.type === 'Tag' ? `# ${node.name}` : node.name

      const baseSize = 2
      const scalingFactor = 0.5
      const nodeSize = baseSize + (node.val || 1) * scalingFactor

      const W_OUTER = isCurrentTag
        ? 2
        : GRAPH_CONFIG.visual.NODE_OUTER_BORDER_WIDTH
      const W_INNER = isCurrentTag
        ? 2
        : GRAPH_CONFIG.visual.NODE_INNER_BORDER_WIDTH

      // Draw glow effect for highlighted nodes
      if (
        isTagHighlighted &&
        node.x != null &&
        node.y != null &&
        !isNaN(node.x) &&
        !isNaN(node.y)
      ) {
        const glowSize = Math.max(
          GRAPH_CONFIG.visual.GLOW_SIZE_MULTIPLIER / globalScale,
          nodeSize + GRAPH_CONFIG.visual.GLOW_MIN_OFFSET_SIZE
        )

        // Ensure glowSize is also valid
        if (!isNaN(glowSize) && isFinite(glowSize)) {
          const gradient = ctx.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            glowSize
          )
          gradient.addColorStop(0, colors.nodeGlow)
          gradient.addColorStop(1, colors.nodeGlowEnd)

          ctx.fillStyle = gradient
          ctx.globalAlpha = GRAPH_CONFIG.visual.GLOW_OPACITY
          ctx.beginPath()
          ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      // Outer border
      ctx.strokeStyle = isTagHighlighted
        ? colors.nodeHighlightOuterBorder
        : isCurrentTag
          ? colors.highlight
          : colors.nodeOuterBorder
      ctx.lineWidth = W_OUTER
      const outerPathRadius = nodeSize / 2 - W_OUTER / 2
      ctx.beginPath()
      ctx.arc(node.x, node.y, Math.max(outerPathRadius, 0), 0, 2 * Math.PI)
      ctx.stroke()

      // Inner border
      ctx.strokeStyle = isCurrentTag ? colors.highlight : colors.nodeInnerBorder
      ctx.lineWidth = W_INNER
      const innerPathRadius = nodeSize / 2 - W_OUTER - W_INNER / 2
      ctx.beginPath()
      ctx.arc(node.x, node.y, Math.max(innerPathRadius, 0), 0, 2 * Math.PI)
      ctx.stroke()

      // Main fill
      ctx.fillStyle = isCurrentTag ? colors.highlight : colors.node
      const fillRadius = nodeSize / 2 - W_OUTER - W_INNER
      ctx.beginPath()
      ctx.arc(node.x, node.y, Math.max(fillRadius, 0), 0, 2 * Math.PI)
      ctx.fill()

      // Draw count inside the node for both 'Tag' and 'Root' types
      if (node.count) {
        const maxTextWidth = fillRadius > 0 ? fillRadius * 1.6 : 0
        const countFontSize = nodeSize * 0.4
        ctx.font = `${countFontSize}px sans-serif`

        const countText = node.count.toString()
        const textMetrics = ctx.measureText(countText)

        if (textMetrics.width > maxTextWidth && maxTextWidth > 0) {
          const newCountFontSize =
            countFontSize * (maxTextWidth / textMetrics.width)
          ctx.font = `${newCountFontSize}px sans-serif`
        }

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = colors.text
        // Vertically center the text more accurately by adding a small offset
        const verticalOffset = fillRadius / 8
        ctx.fillText(countText, node.x, node.y + verticalOffset)
      }

      // Draw label outside the node
      const labelFontSize = GRAPH_CONFIG.visual.TAG_NAME_FONT_SIZE
      ctx.font = `${labelFontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = colors.text

      const textYOffset = nodeSize / 2 + 2 // Adjusted Y offset
      ctx.fillText(label, node.x, node.y + textYOffset)

      ctx.globalAlpha = 1
    },
    [
      isDarkMode,
      currentTag,
      hoveredNode,
      state.highlightTags,
      highlightedNodeIds
    ]
  )

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const colors = isDarkMode ? GRAPH_COLORS.dark : GRAPH_COLORS.light

      ctx.globalAlpha =
        !hoveredNode || highlightedLinks.has(link)
          ? 0.6
          : GRAPH_CONFIG.visual.HOVER_OPACITY

      ctx.beginPath()
      ctx.moveTo(link.source.x, link.source.y)
      ctx.lineTo(link.target.x, link.target.y)
      ctx.strokeStyle = colors.link
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()

      ctx.globalAlpha = 1
    },
    [isDarkMode, hoveredNode, highlightedLinks]
  )

  useEffect(() => {
    if (!containerRef.current || (width && height)) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width: w, height: h } = entries[0].contentRect

        setDimensions({ width: w, height: h })
        setIsDimensionsReady(true)
      }
    })

    resizeObserver.observe(containerRef.current)
    // Initial measurement
    const { width: containerWidth, height: containerHeight } =
      containerRef.current.getBoundingClientRect()
    setDimensions({ width: containerWidth, height: containerHeight })
    setIsDimensionsReady(true)
    return () => resizeObserver.disconnect()
  }, [width, height])

  const containerStyle =
    width && height ? { width, height } : { width: '100%', height: '100%' }
  const graphWidth = width || dimensions.width
  const graphHeight = height || dimensions.height

  if (!tagGraphData || tagGraphData.nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className='text-center'>
          <div className='text-lg font-medium mb-2'>No tags found</div>
          <div className='text-sm text-gray-500'>
            {tagGraphData
              ? 'No tag relationships to display'
              : 'No tag data available'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onMouseEnter={handleMouseEnterCanvas}
      onMouseLeave={handleMouseLeaveCanvas}
    >
      {graphWidth > 0 && graphHeight > 0 && (
        <ForceGraphWrapper
          ref={graphRef}
          graphData={tagGraphData}
          nodeCanvasObject={nodeCanvasObject as any}
          linkCanvasObject={linkCanvasObject as any}
          onNodeClick={handleNodeClick as any}
          onZoomEnd={handleZoomEnd}
          onEngineStop={() => {
            actions.setIsGraphLoaded(true)
            actions.applyCurrentZoom()
            // Process pending fitToHome operations
            const instanceType =
              state.displayType === 'home' ? 'home' : 'sidenav'
            graphControl.processPendingFitToHome(instanceType)
          }}
          onReady={(instance) => {
            setGraphInstance(instance)
            const physics = GRAPH_CONFIG.physics.tag
            instance
              .d3Force('link')
              .distance(physics.linkDistance)
              .strength(physics.linkStrength)
            instance.d3Force('charge').strength(-physics.nodeRepulsion)
          }}
          backgroundColor='transparent'
          width={graphWidth}
          height={graphHeight}
          cooldownTicks={GRAPH_CONFIG.physics.tag.cooldownTicks}
          warmupTicks={GRAPH_CONFIG.physics.tag.warmupTicks}
          d3AlphaDecay={GRAPH_CONFIG.physics.tag.d3AlphaDecay}
          d3VelocityDecay={GRAPH_CONFIG.physics.tag.d3VelocityDecay}
          onNodeHover={handleNodeHover as any}
          onBackgroundClick={() => handleNodeHover(null)}
          onNodeDragEnd={(node: any) => {
            node.fx = undefined
            node.fy = undefined
          }}
        />
      )}
    </div>
  )
}
