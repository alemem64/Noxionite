import { useRef, useCallback } from 'react'

export const useGraphInstance = () => {
  const graphRef = useRef<any>(null)

  const setGraphInstance = useCallback((instance: any) => {
    graphRef.current = instance
  }, [])

  const zoomToFit = useCallback(
    (duration = 400, padding = 50, nodeFilter?: (node: any) => boolean) => {
      if (
        graphRef.current &&
        typeof graphRef.current.zoomToFit === 'function'
      ) {
        try {
          graphRef.current.zoomToFit(duration, padding, nodeFilter)
        } catch (err) {
          console.error('Error zooming to fit:', err)
        }
      } else {
        console.warn(
          '[useGraphInstance] zoomToFit not available - graphRef or zoomToFit function missing'
        )
      }
    },
    []
  )

  const zoomToNode = useCallback(
    (nodeId: string, duration = 400, padding = 50) => {
      if (
        graphRef.current &&
        typeof graphRef.current.zoomToFit === 'function'
      ) {
        try {
          graphRef.current.zoomToFit(
            duration,
            padding,
            (node: any) => node.id === nodeId
          )
        } catch (err) {
          console.error('Error zooming to node:', err)
        }
      }
    },
    []
  )

  const getZoomState = useCallback(() => {
    if (
      graphRef.current &&
      typeof graphRef.current.zoom === 'function' &&
      typeof graphRef.current.centerAt === 'function'
    ) {
      try {
        const center = graphRef.current.centerAt()
        const zoom = graphRef.current.zoom()
        if (center && typeof zoom === 'number') {
          return { zoom, center }
        }
      } catch (err) {
        console.error('Error getting zoom state:', err)
      }
    }
    return null
  }, [])

  const setZoomState = useCallback(
    (zoom: number, center: { x: number; y: number }, ms = 0) => {
      if (
        graphRef.current &&
        typeof graphRef.current.zoom === 'function' &&
        typeof graphRef.current.centerAt === 'function'
      ) {
        try {
          graphRef.current.centerAt(center.x, center.y, ms)
          graphRef.current.zoom(zoom, ms)
        } catch (err) {
          console.error('Error applying zoom state:', err)
        }
      }
    },
    []
  )

  const pauseAnimation = useCallback(() => {
    if (
      graphRef.current &&
      typeof graphRef.current.pauseAnimation === 'function'
    ) {
      graphRef.current.pauseAnimation()
    }
  }, [])

  const resumeAnimation = useCallback(() => {
    if (
      graphRef.current &&
      typeof graphRef.current.resumeAnimation === 'function'
    ) {
      graphRef.current.resumeAnimation()
    }
  }, [])

  return {
    instance: {
      graphRef,
      setGraphInstance
    },
    actions: {
      zoomToFit,
      zoomToNode,
      getZoomState,
      setZoomState,
      pauseAnimation,
      resumeAnimation
    }
  }
}
