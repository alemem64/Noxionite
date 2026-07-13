import React, { useRef, useImperativeHandle, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

// Define interface exposing only necessary methods
export interface GraphMethods {
  zoomToFit: (
    ms?: number,
    padding?: number,
    nodeFilter?: (node: any) => boolean
  ) => void
  width: () => number
  height: () => number
}

type ForceGraphProps = React.ComponentProps<typeof ForceGraph2D> & {
  onReady?: (instance: any) => void
}

const ForceGraphWrapper = React.forwardRef<GraphMethods, ForceGraphProps>(
  ({ onReady, ...restProps }, ref) => {
    const internalRef = useRef<any>(null)

    // Expose only necessary methods when ref is set
    useImperativeHandle(
      ref,
      () => ({
        zoomToFit: (
          ms?: number,
          padding?: number,
          nodeFilter?: (node: any) => boolean
        ) => {
          if (
            internalRef.current &&
            typeof internalRef.current.zoomToFit === 'function'
          ) {
            internalRef.current.zoomToFit(ms, padding, nodeFilter)
          }
        },
        width: () => {
          return internalRef.current?.width?.() || 0
        },
        height: () => {
          return internalRef.current?.height?.() || 0
        }
      }),
      []
    )

    useEffect(() => {
      if (internalRef.current && onReady) {
        onReady(internalRef.current)
      }
    }, [onReady])

    return <ForceGraph2D {...restProps} ref={internalRef} />
  }
)

ForceGraphWrapper.displayName = 'ForceGraphWrapper'

export default ForceGraphWrapper
