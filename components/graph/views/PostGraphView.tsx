import React, { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useGraphContext } from '../GraphProvider'
import { useDarkMode } from '@/lib/use-dark-mode'
import { GRAPH_CONFIG, GRAPH_COLORS, HOME_NODE_ID } from '../utils/graphConfig'
import { graphControl } from '../utils/graph-control'
import type { GraphNode } from '../types/graph.types'

const ForceGraphWrapper = dynamic(() => import('../ForceGraphWrapper'), {
  ssr: false,
  loading: () => <div>Loading graph...</div>
})

interface PostGraphViewProps {
  width?: number
  height?: number
  className?: string
}

export const PostGraphView: React.FC<PostGraphViewProps> = ({
  width,
  height,
  className = ''
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

  const { postGraphData } = data
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

      let path = ''
      if (node.type === 'Post' || node.type === 'Home') {
        path = `/post/${node.slug}`
      } else if (node.type === 'Category' || node.type === 'Database') {
        path = `/category/${node.slug}`
      } else if (node.type === 'Root') {
        path = '/'
      }

      if (path) {
        void router.push(path)
      }
    },
    [router, actions, state.isModalOpen]
  )

  useEffect(() => {
    if (
      state.isGraphLoaded &&
      graphRef.current &&
      state.currentView === 'post_view' &&
      isDimensionsReady
    ) {
      actions.applyCurrentZoom()
    }
  }, [state.currentView, state.isGraphLoaded, isDimensionsReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (graphRef.current && actions.applyCurrentZoom) {
      actions.applyCurrentZoom()
    }
  }, [graphRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      if (!isMouseInCanvas) return

      setHoveredNode(node)
      const newHighlightedNodeIds = new Set<string>()
      const newHighlightedLinks = new Set<any>()

      if (node) {
        newHighlightedNodeIds.add(node.id as string)
        postGraphData?.links.forEach((link) => {
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
    [postGraphData, isMouseInCanvas]
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

  const drawImageFillShape = useCallback(
    (
      img: HTMLImageElement,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const imgAspect = img.width / img.height
      const containerAspect = width / height
      let drawWidth, drawHeight, offsetX, offsetY
      if (imgAspect > containerAspect) {
        drawHeight = height
        drawWidth = height * imgAspect
        offsetX = (width - drawWidth) / 2
        offsetY = 0
      } else {
        drawWidth = width
        drawHeight = width / imgAspect
        offsetX = 0
        offsetY = (height - drawHeight) / 2
      }
      return { drawWidth, drawHeight, offsetX, offsetY }
    },
    []
  )

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Skip rendering if coordinates are invalid
      if (node.x == null || node.y == null || isNaN(node.x) || isNaN(node.y)) {
        return
      }

      const colors = isDarkMode ? GRAPH_COLORS.dark : GRAPH_COLORS.light
      const isSlugHighlighted =
        state.highlightSlugs.length > 0 &&
        node.slug &&
        state.highlightSlugs.includes(node.slug)
      const isHoveredHighlighted = highlightedNodeIds.has(node.id as string)
      ctx.globalAlpha =
        !hoveredNode || isHoveredHighlighted
          ? 1
          : GRAPH_CONFIG.visual.HOVER_OPACITY

      const label = node.name
      let nodeSize: number
      let cornerRadius: number

      if (node.id === HOME_NODE_ID) {
        nodeSize = GRAPH_CONFIG.visual.HOME_NODE_SIZE
        cornerRadius = GRAPH_CONFIG.visual.HOME_CORNER_RADIUS
      } else if (node.type === 'Category') {
        nodeSize = GRAPH_CONFIG.visual.CATEGORY_NODE_SIZE
        cornerRadius = GRAPH_CONFIG.visual.CATEGORY_CORNER_RADIUS
      } else if (node.type === 'Database') {
        nodeSize = GRAPH_CONFIG.visual.DB_NODE_SIZE
        cornerRadius = GRAPH_CONFIG.visual.DB_CORNER_RADIUS
      } else {
        nodeSize = GRAPH_CONFIG.visual.POST_NODE_SIZE
        cornerRadius = nodeSize / 2
      }

      const W_OUTER = GRAPH_CONFIG.visual.NODE_OUTER_BORDER_WIDTH
      const W_INNER = GRAPH_CONFIG.visual.NODE_INNER_BORDER_WIDTH

      // Draw glow effect for highlighted nodes (only for non-home nodes)
      if (
        isSlugHighlighted &&
        node.x != null &&
        node.y != null &&
        !isNaN(node.x) &&
        !isNaN(node.y) &&
        node.id !== HOME_NODE_ID
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

      // Special handling for home node - display icon.png directly
      if (node.id === HOME_NODE_ID) {
        if (node.img && node.img.complete) {
          // Draw the icon.png image directly without borders or radius
          ctx.drawImage(
            node.img,
            node.x! - nodeSize / 2,
            node.y! - nodeSize / 2,
            nodeSize,
            nodeSize
          )
        } else {
          // Fallback: draw a simple square if image not loaded
          ctx.fillStyle = colors.node
          ctx.fillRect(
            node.x! - nodeSize / 2,
            node.y! - nodeSize / 2,
            nodeSize,
            nodeSize
          )
        }
      } else if (node.type === 'Database') {
        // Draw rounded rectangle (same as category) for database nodes
        const radius = GRAPH_CONFIG.visual.DB_CORNER_RADIUS
        ctx.strokeStyle = isSlugHighlighted
          ? colors.nodeHighlightOuterBorder
          : colors.nodeOuterBorder
        ctx.lineWidth = W_OUTER
        const outerPathX = node.x! - nodeSize / 2 + W_OUTER / 2
        const outerPathY = node.y! - nodeSize / 2 + W_OUTER / 2
        const outerPathSize = nodeSize - W_OUTER
        const outerPathRadius = radius - W_OUTER / 2
        ctx.beginPath()
        ctx.roundRect(
          outerPathX,
          outerPathY,
          outerPathSize,
          outerPathSize,
          Math.max(outerPathRadius, 0)
        )
        ctx.stroke()

        ctx.strokeStyle = colors.nodeInnerBorder
        ctx.lineWidth = W_INNER
        const innerPathX = node.x! - nodeSize / 2 + W_OUTER + W_INNER / 2
        const innerPathY = node.y! - nodeSize / 2 + W_OUTER + W_INNER / 2
        const innerPathSize = nodeSize - 2 * W_OUTER - W_INNER
        const innerPathRadius = radius - W_OUTER - W_INNER / 2
        ctx.beginPath()
        ctx.roundRect(
          innerPathX,
          innerPathY,
          innerPathSize,
          innerPathSize,
          Math.max(innerPathRadius, 0)
        )
        ctx.stroke()

        ctx.fillStyle = colors.node
        const fillX = node.x! - nodeSize / 2 + W_OUTER + W_INNER
        const fillY = node.y! - nodeSize / 2 + W_OUTER + W_INNER
        const fillSize = nodeSize - 2 * (W_OUTER + W_INNER)
        const fillRadius = radius - W_OUTER - W_INNER
        ctx.beginPath()
        ctx.roundRect(fillX, fillY, fillSize, fillSize, Math.max(fillRadius, 0))
        ctx.fill()

        if (node.imageUrl && node.img && node.img.complete) {
          ctx.save()
          const imageAreaOffset = W_OUTER + W_INNER
          const imageAreaSize = nodeSize - 2 * imageAreaOffset
          if (imageAreaSize > 0) {
            const imageCornerRadius = radius - imageAreaOffset
            ctx.beginPath()
            ctx.roundRect(
              node.x! - imageAreaSize / 2,
              node.y! - imageAreaSize / 2,
              imageAreaSize,
              imageAreaSize,
              Math.max(imageCornerRadius, 0)
            )
            ctx.clip()
            const { drawWidth, drawHeight, offsetX, offsetY } =
              drawImageFillShape(
                node.img,
                node.x! - imageAreaSize / 2,
                node.y! - imageAreaSize / 2,
                imageAreaSize,
                imageAreaSize
              )
            ctx.drawImage(
              node.img,
              node.x! + offsetX - imageAreaSize / 2,
              node.y! + offsetY - imageAreaSize / 2,
              drawWidth,
              drawHeight
            )
            ctx.restore()
          }
        }
      } else {
        // Draw borders and background for non-home nodes
        ctx.strokeStyle = isSlugHighlighted
          ? colors.nodeHighlightOuterBorder
          : colors.nodeOuterBorder
        ctx.lineWidth = W_OUTER
        if (node.type === 'Category') {
          const outerPathX = node.x - nodeSize / 2 + W_OUTER / 2
          const outerPathY = node.y - nodeSize / 2 + W_OUTER / 2
          const outerPathSize = nodeSize - W_OUTER
          const outerPathRadius = cornerRadius - W_OUTER / 2
          ctx.beginPath()
          ctx.roundRect(
            outerPathX,
            outerPathY,
            outerPathSize,
            outerPathSize,
            Math.max(outerPathRadius, 0)
          )
          ctx.stroke()
        } else {
          const outerPathRadius = nodeSize / 2 - W_OUTER / 2
          ctx.beginPath()
          ctx.arc(node.x, node.y, Math.max(outerPathRadius, 0), 0, 2 * Math.PI)
          ctx.stroke()
        }

        ctx.strokeStyle = colors.nodeInnerBorder
        ctx.lineWidth = W_INNER
        if (node.type === 'Category') {
          const innerPathX = node.x - nodeSize / 2 + W_OUTER + W_INNER / 2
          const innerPathY = node.y - nodeSize / 2 + W_OUTER + W_INNER / 2
          const innerPathSize = nodeSize - 2 * W_OUTER - W_INNER
          const innerPathRadius = cornerRadius - W_OUTER - W_INNER / 2
          ctx.beginPath()
          ctx.roundRect(
            innerPathX,
            innerPathY,
            innerPathSize,
            innerPathSize,
            Math.max(innerPathRadius, 0)
          )
          ctx.stroke()
        } else {
          const innerPathRadius = nodeSize / 2 - W_OUTER - W_INNER / 2
          ctx.beginPath()
          ctx.arc(node.x, node.y, Math.max(innerPathRadius, 0), 0, 2 * Math.PI)
          ctx.stroke()
        }

        ctx.fillStyle = colors.node
        if (node.type === 'Category') {
          const fillX = node.x - nodeSize / 2 + W_OUTER + W_INNER
          const fillY = node.y - nodeSize / 2 + W_OUTER + W_INNER
          const fillSize = nodeSize - 2 * (W_OUTER + W_INNER)
          const fillRadius = cornerRadius - W_OUTER - W_INNER
          ctx.beginPath()
          ctx.roundRect(
            fillX,
            fillY,
            fillSize,
            fillSize,
            Math.max(fillRadius, 0)
          )
          ctx.fill()
        } else {
          const fillRadius = nodeSize / 2 - W_OUTER - W_INNER
          ctx.beginPath()
          ctx.arc(node.x, node.y, Math.max(fillRadius, 0), 0, 2 * Math.PI)
          ctx.fill()
        }

        if (node.imageUrl && node.img && node.img.complete) {
          ctx.save()
          const imageAreaOffset = W_OUTER + W_INNER
          const imageAreaSize = nodeSize - 2 * imageAreaOffset
          if (imageAreaSize > 0) {
            if (node.type === 'Category') {
              const imageCornerRadius = cornerRadius - imageAreaOffset
              ctx.beginPath()
              ctx.roundRect(
                node.x! - imageAreaSize / 2,
                node.y! - imageAreaSize / 2,
                imageAreaSize,
                imageAreaSize,
                Math.max(imageCornerRadius, 0)
              )
            } else {
              const imageRadius = imageAreaSize / 2
              ctx.beginPath()
              ctx.arc(node.x!, node.y!, imageRadius, 0, 2 * Math.PI)
            }
            ctx.clip()
            const { drawWidth, drawHeight, offsetX, offsetY } =
              drawImageFillShape(
                node.img,
                node.x! - imageAreaSize / 2,
                node.y! - imageAreaSize / 2,
                imageAreaSize,
                imageAreaSize
              )
            ctx.drawImage(
              node.img,
              node.x! + offsetX - imageAreaSize / 2,
              node.y! + offsetY - imageAreaSize / 2,
              drawWidth,
              drawHeight
            )
            ctx.restore()
          }
        }
      }

      const fontSize =
        node.type === 'Root'
          ? GRAPH_CONFIG.visual.HOME_NAME_FONT_SIZE
          : node.type === 'Category'
            ? GRAPH_CONFIG.visual.CATEGORY_FONT_SIZE
            : node.type === 'Database'
              ? GRAPH_CONFIG.visual.DB_NAME_FONT_SIZE
              : GRAPH_CONFIG.visual.POST_FONT_SIZE
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = colors.text
      const textYOffset = nodeSize / 2 + 2
      ctx.fillText(label, node.x!, node.y! + textYOffset)

      ctx.globalAlpha = 1
    },
    [
      isDarkMode,
      hoveredNode,
      highlightedNodeIds,
      state.highlightSlugs,
      drawImageFillShape
    ]
  )

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const colors = isDarkMode ? GRAPH_COLORS.dark : GRAPH_COLORS.light
      ctx.globalAlpha =
        !hoveredNode || highlightedLinks.has(link)
          ? 1
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
    return () => resizeObserver.disconnect()
  }, [width, height])

  const containerStyle =
    width && height ? { width, height } : { width: '100%', height: '100%' }
  const graphWidth = width || dimensions.width
  const graphHeight = height || dimensions.height

  if (!postGraphData || postGraphData.nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={containerStyle}
      >
        ...
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
          graphData={postGraphData}
          nodeCanvasObject={nodeCanvasObject as any}
          linkCanvasObject={linkCanvasObject as any}
          onNodeClick={handleNodeClick as any}
          onZoomEnd={handleZoomEnd}
          onEngineStop={() => {
            actions.setIsGraphLoaded(true)
            // Process pending fitToHome operations
            const instanceType =
              state.displayType === 'home' ? 'home' : 'sidenav'
            graphControl.processPendingFitToHome(instanceType)
          }}
          onReady={(instance) => {
            setGraphInstance(instance)
            const physics = GRAPH_CONFIG.physics.post
            instance
              .d3Force('link')
              .distance(physics.linkDistance)
              .strength(physics.linkStrength)
            instance.d3Force('charge').strength(-physics.nodeRepulsion)
          }}
          backgroundColor='transparent'
          width={graphWidth}
          height={graphHeight}
          cooldownTicks={GRAPH_CONFIG.physics.post.cooldownTicks}
          warmupTicks={GRAPH_CONFIG.physics.post.warmupTicks}
          d3AlphaDecay={GRAPH_CONFIG.physics.post.d3AlphaDecay}
          d3VelocityDecay={GRAPH_CONFIG.physics.post.d3VelocityDecay}
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
