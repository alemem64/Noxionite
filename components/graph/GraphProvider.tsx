import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useState
} from 'react'
import { useRouter } from 'next/router'
import type { GraphContextValue, GraphViewType } from './types/graph.types'
import { useGraphState } from './hooks/useGraphState'
import { useGraphData } from './hooks/useGraphData'
import { useGraphInstance } from './hooks/useGraphInstance'
import localeConfig from '../../site.locale.json'
import type { SiteMap } from '@/lib/context/types'
import { graphControl, calculateZoomLevel } from './utils/graph-control'
import { GRAPH_CONFIG } from './utils/graphConfig'

// Helper function to get canvas dimensions
const getCanvasDimensions = (
  graphInstance: any,
  currentView: GraphViewType
) => {
  // Get actual canvas dimensions if available
  const actualWidth = graphInstance.width?.()
  const actualHeight = graphInstance.height?.()

  if (actualWidth && actualHeight) {
    return { width: actualWidth, height: actualHeight }
  }

  // Fallback to view-specific config
  switch (currentView) {
    case 'post_view':
    case 'tag_view':
      return {
        width: GRAPH_CONFIG.responsive.sidenav.width,
        height: GRAPH_CONFIG.responsive.sidenav.height
      }
    default:
      return {
        width: GRAPH_CONFIG.responsive.home.width,
        height: GRAPH_CONFIG.responsive.home.height
      }
  }
}

const GraphContext = createContext<GraphContextValue | undefined>(undefined)

export interface GraphProviderProps {
  children: ReactNode
  siteMap?: SiteMap
  recordMap?: any
  locale?: string
  instanceType?: 'sidenav' | 'home'
}

export const GraphProvider: React.FC<GraphProviderProps> = ({
  children,
  siteMap,
  recordMap,
  locale = localeConfig.defaultLocale,
  instanceType = 'sidenav'
}) => {
  // Set siteMap and recordMap in graphControl when available
  useEffect(() => {
    if (siteMap) {
      graphControl.setSiteMap(siteMap)
    }
    if (recordMap) {
      graphControl.setRecordMap(recordMap)
    }
  }, [siteMap, recordMap])

  const router = useRouter()
  const { state, actions: stateActions } = useGraphState()
  const graphData = useGraphData(siteMap, locale)
  const { instance, actions: instanceActions } = useGraphInstance()

  const saveCurrentZoom = useCallback(() => {
    const zoomState = instanceActions.getZoomState()
    if (zoomState) {
      stateActions.setZoomStateForView(state.currentView, zoomState)
    }
  }, [instanceActions, stateActions, state.currentView])

  const applyCurrentZoom = useCallback(
    (fitView = false) => {
      const savedZoom = state.zoomState[state.currentView]
      if (savedZoom && !fitView) {
        instanceActions.setZoomState(savedZoom.zoom, savedZoom.center)
      } else {
        instanceActions.zoomToFit()
      }
    },
    [instanceActions, state.zoomState, state.currentView]
  )

  // Track continuous focus operations
  const [continuousFocus, setContinuousFocus] = useState<{
    type: 'slug' | 'node'
    target: string
    options?: any
  } | null>(null)

  // Create slug-to-id mapping based on specified view type
  const createSlugToIdMapping = useCallback(
    (viewType?: GraphViewType): Map<string, string> => {
      const mapping = new Map<string, string>()
      const targetView = viewType || state.currentView

      if (targetView === 'post_view' && graphData.data.postGraph) {
        graphData.data.postGraph.nodes.forEach((node) => {
          if (node.slug) {
            mapping.set(node.slug, node.id)
          }
        })
      } else if (targetView === 'tag_view' && graphData.data.tagGraph) {
        graphData.data.tagGraph.nodes.forEach((node) => {
          if (node.slug) {
            mapping.set(node.slug, node.id)
          }
        })
      }

      return mapping
    },
    [graphData.data.postGraph, graphData.data.tagGraph, state.currentView]
  )

  // Helper function to perform the actual focus operation
  const performFocus = useCallback(
    (nodeIds: string[], options?: any) => {
      const _currentInstanceType = instanceType || 'main'

      if (nodeIds.length === 1) {
        // Single node: use zoomToNode

        instanceActions.zoomToNode(
          nodeIds[0],
          options?.duration,
          options?.padding
        )
      } else {
        // Multiple nodes: use multi-node zooming

        const currentGraphData =
          state.currentView === 'post_view'
            ? graphData.data.postGraph
            : graphData.data.tagGraph
        if (!currentGraphData || !currentGraphData.nodes) {
          return
        }

        // Find the actual nodes from the provided node IDs
        const targetNodes = currentGraphData.nodes.filter((node: any) =>
          nodeIds.includes(node.id)
        )

        if (targetNodes.length === 0) {
          return
        }

        // Multiple nodes: calculate bounding box
        const xCoords = targetNodes.map((node: any) => node.x)
        const yCoords = targetNodes.map((node: any) => node.y)

        const minX = Math.min(...xCoords)
        const maxX = Math.max(...xCoords)
        const minY = Math.min(...yCoords)
        const maxY = Math.max(...yCoords)

        // Calculate center and dimensions
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        const graphInstance = instance.graphRef.current
        if (!graphInstance) {
          return
        }

        const { width: canvasWidth, height: canvasHeight } =
          getCanvasDimensions(graphInstance, state.currentView)
        const padding = options?.padding || GRAPH_CONFIG.zoom.DEFAULT_PADDING

        const zoomLevel = calculateZoomLevel(
          { minX, maxX, minY, maxY },
          canvasWidth,
          canvasHeight,
          padding
        )

        // Apply the calculated zoom and center
        if (
          typeof graphInstance.centerAt === 'function' &&
          typeof graphInstance.zoom === 'function'
        ) {
          const duration = options?.duration || 400
          graphInstance.centerAt(centerX, centerY, duration)
          graphInstance.zoom(zoomLevel, duration)
        } else {
          // Fallback to zoomToFit with filter
          const nodeIdSet = new Set(nodeIds)
          graphInstance.zoomToFit(
            options?.duration,
            options?.padding,
            (node: any) => nodeIdSet.has(node.id)
          )
        }
      }
    },
    [state.currentView, instanceActions, instance.graphRef, instanceType]
  ) // eslint-disable-line react-hooks/exhaustive-deps

  // Graph control API listener
  useEffect(() => {
    const _currentInstanceType = instanceType || 'sidenav'

    // Queue for pending focus operations
    const pendingFocusQueue: Array<{
      type: string
      payload?: any
      options?: any
      targetView?: string
      continuous?: boolean
    }> = []

    // Process pending focus operations when data is ready
    const processPendingFocus = () => {
      if (graphData.isLoading) {
        return // Wait for data to be ready
      }

      // Check if we have data for the current view
      const hasPostData =
        graphData.data.postGraph && graphData.data.postGraph.nodes.length > 0
      const hasTagData =
        graphData.data.tagGraph && graphData.data.tagGraph.nodes.length > 0

      if (state.currentView === 'post_view' && !hasPostData) {
        return // Wait for post data
      }

      if (state.currentView === 'tag_view' && !hasTagData) {
        return // Wait for tag data
      }

      while (pendingFocusQueue.length > 0) {
        const operation = pendingFocusQueue.shift()
        if (!operation) continue

        // Skip if this operation is for a different view
        if (
          operation.targetView &&
          operation.targetView !== state.currentView
        ) {
          continue
        }

        switch (operation.type) {
          case 'focusBySlug': {
            const slugToIdMapping = createSlugToIdMapping(
              operation.targetView as GraphViewType
            )
            const slugs =
              operation.payload?.slugs ||
              (operation.payload ? [operation.payload] : [])

            const nodeIds = slugs
              .map((slug: string) => slugToIdMapping.get(slug))
              .filter(
                (id: string | undefined): id is string => id !== undefined
              )

            if (nodeIds.length === 0) {
              return
            }

            if (nodeIds.length === 1) {
              if (operation.continuous) {
                setContinuousFocus({
                  type: 'slug',
                  target: slugs[0],
                  options: operation.options
                })
              } else {
                instanceActions.zoomToNode(
                  nodeIds[0],
                  operation.options?.duration,
                  operation.options?.padding
                )
              }
            } else {
              // For multiple nodes, we need to handle this differently
              // This will be processed by the main focusNodes case when the queue is executed
            }
            break
          }
          case 'focusNode':
            if (operation.continuous) {
              setContinuousFocus({
                type: 'node',
                target: operation.payload,
                options: operation.options
              })
            } else {
              instanceActions.zoomToNode(
                operation.payload,
                operation.options?.duration,
                operation.options?.padding
              )
            }
            break
          case 'focusNodes': {
            const queuedNodeIds = operation.payload
            if (
              queuedNodeIds &&
              Array.isArray(queuedNodeIds) &&
              queuedNodeIds.length > 0
            ) {
              const currentGraphData =
                state.currentView === 'post_view'
                  ? graphData.data.postGraph
                  : graphData.data.tagGraph
              if (!currentGraphData || !currentGraphData.nodes) {
                return
              }

              const targetNodes = currentGraphData.nodes.filter((node: any) =>
                queuedNodeIds.includes(node.id)
              )

              if (targetNodes.length === 0) {
                return
              }

              if (targetNodes.length === 1) {
                if (operation.continuous) {
                  setContinuousFocus({
                    type: 'node',
                    target: targetNodes[0].id,
                    options: operation.options
                  })
                } else {
                  instanceActions.zoomToNode(
                    targetNodes[0].id,
                    operation.options?.duration,
                    operation.options?.padding
                  )
                }
              } else {
                // For multiple nodes, we don't support continuous retry yet
                // Just perform the zoom operation once
                const xCoords = targetNodes.map((node: any) => node.x)
                const yCoords = targetNodes.map((node: any) => node.y)
                const minX = Math.min(...xCoords)
                const maxX = Math.max(...xCoords)
                const minY = Math.min(...yCoords)
                const maxY = Math.max(...yCoords)

                const centerX = (minX + maxX) / 2
                const centerY = (minY + maxY) / 2

                const graphInstance = instance.graphRef.current
                if (!graphInstance) {
                  return
                }

                const { width: canvasWidth, height: canvasHeight } =
                  getCanvasDimensions(graphInstance, state.currentView)
                const padding =
                  operation.options?.padding ||
                  GRAPH_CONFIG.zoom.DEFAULT_PADDING

                const zoomLevel = calculateZoomLevel(
                  { minX, maxX, minY, maxY },
                  canvasWidth,
                  canvasHeight,
                  padding
                )

                if (
                  typeof graphInstance.centerAt === 'function' &&
                  typeof graphInstance.zoom === 'function'
                ) {
                  const duration = operation.options?.duration || 400
                  graphInstance.centerAt(centerX, centerY, duration)
                  graphInstance.zoom(zoomLevel, duration)
                } else {
                  const nodeIdSet = new Set(queuedNodeIds)
                  graphInstance.zoomToFit(
                    operation.options?.duration,
                    operation.options?.padding,
                    (node: any) => nodeIdSet.has(node.id)
                  )
                }
              }
            }
            break
          }
        }
      }
    }

    const handleControlMessage = (message: any) => {
      if (message.instanceType === _currentInstanceType) {
        switch (message.type) {
          case 'fitToHome':
            instanceActions.zoomToFit(
              message.payload?.options?.duration,
              message.payload?.options?.padding
            )
            break
          case 'focusNode':
            if (graphData.isLoading) {
              pendingFocusQueue.push({
                type: 'focusNode',
                payload: message.payload?.nodeId,
                options: message.payload?.options,
                targetView: state.currentView,
                continuous: message.payload?.continuous
              })
            } else {
              const nodeId = message.payload.nodeId
              const currentGraphData =
                state.currentView === 'post_view'
                  ? graphData.data.postGraph
                  : graphData.data.tagGraph
              const node = currentGraphData?.nodes?.find(
                (n: any) => n.id === nodeId
              )

              if (node) {
                // Use performFocus for consistent behavior
                performFocus([nodeId], message.payload?.options)
              }

              // Handle continuous retry if enabled
              if (message.payload?.continuous) {
                let retryCount = 0
                const maxRetries = GRAPH_CONFIG.performance.focusTry
                const retryInterval = GRAPH_CONFIG.performance.focusFrequency

                const startTime = Date.now()
                const intervalId = setInterval(() => {
                  try {
                    retryCount++
                    const _elapsed = Date.now() - startTime

                    const currentGraphData =
                      state.currentView === 'post_view'
                        ? graphData.data.postGraph
                        : graphData.data.tagGraph
                    const currentNode = currentGraphData?.nodes?.find(
                      (n: any) => n.id === nodeId
                    )

                    if (currentNode) {
                      performFocus([nodeId], message.payload?.options)

                      if (retryCount >= maxRetries) {
                        const _totalElapsed = Date.now() - startTime
                        clearInterval(intervalId)
                      }
                    } else if (retryCount >= maxRetries) {
                      const _totalElapsed = Date.now() - startTime
                      clearInterval(intervalId)
                    }
                  } catch (err) {
                    console.warn(
                      `[GraphProvider ${_currentInstanceType}] Error in local continuous retry:`,
                      err
                    )
                    clearInterval(intervalId)
                  }
                }, retryInterval)
              } else if (node) {
                // Single execution - perform focus immediately only if node found and no continuous retry
                performFocus([nodeId], message.payload?.options)
              }
            }
            break

          case 'focusNodes':
            if (graphData.isLoading) {
              pendingFocusQueue.push({
                type: 'focusNodes',
                payload: message.payload?.nodeIds,
                options: message.payload?.options,
                targetView: state.currentView,
                continuous: message.payload?.continuous
              })
            } else {
              const nodeIds = message.payload?.nodeIds
              if (nodeIds && Array.isArray(nodeIds) && nodeIds.length > 0) {
                const currentGraphData =
                  state.currentView === 'post_view'
                    ? graphData.data.postGraph
                    : graphData.data.tagGraph
                const targetNodes =
                  currentGraphData?.nodes?.filter((node: any) =>
                    nodeIds.includes(node.id)
                  ) || []

                if (targetNodes.length > 0) {
                  // Use performFocus for consistent behavior
                  const actualNodeIds = targetNodes.map((node) => node.id)
                  performFocus(actualNodeIds, message.payload?.options)
                }

                // Handle continuous retry if enabled
                if (message.payload?.continuous) {
                  let retryCount = 0
                  const maxRetries = GRAPH_CONFIG.performance.focusTry
                  const retryInterval = GRAPH_CONFIG.performance.focusFrequency

                  const startTime = Date.now()
                  const intervalId = setInterval(() => {
                    try {
                      retryCount++

                      const currentGraphData =
                        state.currentView === 'post_view'
                          ? graphData.data.postGraph
                          : graphData.data.tagGraph
                      const currentTargetNodes =
                        currentGraphData?.nodes?.filter((node: any) =>
                          nodeIds.includes(node.id)
                        ) || []

                      if (currentTargetNodes.length > 0) {
                        const actualNodeIds = currentTargetNodes.map(
                          (node) => node.id
                        )

                        performFocus(actualNodeIds, message.payload?.options)

                        if (retryCount >= maxRetries) {
                          const _totalElapsed = Date.now() - startTime
                          clearInterval(intervalId)
                        }
                      } else if (retryCount >= maxRetries) {
                        const _totalElapsed = Date.now() - startTime
                        clearInterval(intervalId)
                      }
                    } catch (err) {
                      console.warn(
                        `[GraphProvider ${_currentInstanceType}] Error in local continuous retry:`,
                        err
                      )
                      clearInterval(intervalId)
                    }
                  }, retryInterval)
                } else if (targetNodes.length > 0) {
                  // Single execution - perform focus immediately only if nodes found and no continuous retry
                  const actualNodeIds = targetNodes.map((node) => node.id)

                  performFocus(actualNodeIds, message.payload?.options)
                }
              }
            }
            break

          case 'focusBySlug':
            if (graphData.isLoading) {
              const slugs =
                message.payload?.slugs ||
                (message.payload?.slug ? [message.payload.slug] : [])
              pendingFocusQueue.push({
                type: 'focusBySlug',
                payload: { slugs, options: message.payload?.options },
                options: message.payload?.options,
                targetView: state.currentView,
                continuous: message.payload?.continuous
              })
            } else {
              // Handle both single slug (string) and multiple slugs (array)
              const slugs =
                message.payload?.slugs ||
                (message.payload?.slug ? [message.payload.slug] : [])

              if (slugs && slugs.length > 0) {
                const slugToIdMapping = createSlugToIdMapping()
                const nodeIds = slugs
                  .map((slug: string) => slugToIdMapping.get(slug))
                  .filter(
                    (id: string | undefined): id is string => id !== undefined
                  )

                if (nodeIds.length === 0) {
                  console.warn(
                    `[GraphProvider ${_currentInstanceType}] No nodes found for slugs:`,
                    slugs
                  )
                }

                // Handle continuous retry if enabled

                if (message.payload?.continuous) {
                  let retryCount = 0
                  const maxRetries = GRAPH_CONFIG.performance.focusTry
                  const retryInterval = GRAPH_CONFIG.performance.focusFrequency

                  const startTime = Date.now()
                  const intervalId = setInterval(() => {
                    try {
                      retryCount++
                      const _elapsed = Date.now() - startTime

                      const currentSlugToIdMapping = createSlugToIdMapping()
                      const currentNodeIds = slugs
                        .map((slug: string) => currentSlugToIdMapping.get(slug))
                        .filter(
                          (id: string | undefined): id is string =>
                            id !== undefined
                        )

                      if (currentNodeIds.length > 0) {
                        performFocus(currentNodeIds, message.payload?.options)

                        if (retryCount >= maxRetries) {
                          const _totalElapsed = Date.now() - startTime
                          clearInterval(intervalId)
                        }
                      } else if (retryCount >= maxRetries) {
                        const _totalElapsed = Date.now() - startTime
                        clearInterval(intervalId)
                      }
                    } catch (err) {
                      console.warn(
                        `[GraphProvider ${_currentInstanceType}] Error in local continuous retry:`,
                        err
                      )
                      clearInterval(intervalId)
                    }
                  }, retryInterval)
                } else if (nodeIds.length > 0) {
                  // Single execution - perform focus immediately only if nodes found and no continuous retry
                  performFocus(nodeIds, message.payload?.options)
                }
              }
            }
            break

          case 'highlightNodes':
            if (message.payload?.type === 'slug') {
              stateActions.setHighlightSlugs(message.payload.values || [])
            } else if (message.payload?.type === 'tag') {
              stateActions.setHighlightTags(message.payload.values || [])
            }
            break

          case 'clearHighlight':
            stateActions.clearHighlight()
            break

          case 'changeView':
            if (message.payload?.view) {
              stateActions.setCurrentView(message.payload?.view)

              // Process any pending fitToHome operations immediately for the new view
              setTimeout(() => {
                graphControl.processPendingFitToHome(_currentInstanceType)
              }, 100)
            }
            break
        }
      }
    }

    // Process pending operations when data is loaded
    processPendingFocus()

    graphControl.addListener(_currentInstanceType, handleControlMessage)

    return () => {
      graphControl.removeListener(_currentInstanceType, handleControlMessage)
    }
  }, [
    instanceActions,
    stateActions,
    graphData.data.postGraph,
    graphData.isLoading,
    state.currentView
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle initial focus on page load and route changes
  useEffect(() => {
    const hasPostData =
      graphData.data.postGraph && graphData.data.postGraph.nodes.length > 0
    const hasTagData =
      graphData.data.tagGraph && graphData.data.tagGraph.nodes.length > 0
    const hasGraphInstance = instance.graphRef.current !== null
    const graphReady =
      state.isGraphLoaded && hasGraphInstance && (hasPostData || hasTagData)

    if (graphReady) {
      // Add a longer delay for route changes to ensure physics engine is fully stabilized
      setTimeout(() => {
        graphControl.processInitialFocusWhenReady(instanceType, true)
      }, 800)
    }
  }, [
    state.isGraphLoaded,
    graphData.data.postGraph,
    graphData.data.tagGraph,
    state.currentView,
    instanceType,
    instance.graphRef.current,
    router.pathname
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle client-side navigation (Next.js <Link>)
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Handle URL-based focus for client-side navigation using initial focus logic
      graphControl.handleUrlInitialFocus(url, instanceType)

      // Force processing for route changes even if graph is already ready
      setTimeout(() => {
        const hasPostData =
          graphData.data.postGraph && graphData.data.postGraph.nodes.length > 0
        const hasTagData =
          graphData.data.tagGraph && graphData.data.tagGraph.nodes.length > 0
        const hasGraphInstance = instance.graphRef.current !== null
        const graphReady =
          state.isGraphLoaded && hasGraphInstance && (hasPostData || hasTagData)

        if (graphReady) {
          graphControl.processInitialFocusWhenReady(instanceType, true)
        }
      }, 100)
    }

    // Listen for route changes
    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [
    instanceType,
    state.currentView,
    router.events,
    graphData.data.postGraph,
    graphData.data.tagGraph,
    state.isGraphLoaded,
    instance.graphRef.current
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle continuous focusing retry
  useEffect(() => {
    if (continuousFocus && !graphData.isLoading) {
      let retryCount = 0
      const maxRetries = GRAPH_CONFIG.performance.focusTry
      const retryInterval = GRAPH_CONFIG.performance.focusFrequency

      // Store current values in refs to prevent stale closures
      const currentContinuousFocus = continuousFocus
      const currentInstanceActions = instanceActions
      const currentCreateSlugToIdMapping = createSlugToIdMapping

      const startTime = Date.now()

      const intervalId = setInterval(() => {
        try {
          retryCount++
          const _elapsed = Date.now() - startTime

          let nodeId: string | undefined

          if (currentContinuousFocus.type === 'slug') {
            const slugToIdMapping = currentCreateSlugToIdMapping()
            nodeId = slugToIdMapping.get(currentContinuousFocus.target)
          } else if (currentContinuousFocus.type === 'node') {
            nodeId = currentContinuousFocus.target
          }

          if (nodeId) {
            currentInstanceActions.zoomToNode(
              nodeId,
              currentContinuousFocus.options?.duration,
              currentContinuousFocus.options?.padding
            )
          }

          // Continue retrying until max retries reached
          if (retryCount >= maxRetries) {
            setContinuousFocus(null)
            clearInterval(intervalId)
          }
        } catch (err) {
          console.warn(`[GraphProvider] Error in continuous focus:`, err)
          setContinuousFocus(null)
          clearInterval(intervalId)
        }
      }, retryInterval)

      return () => {
        clearInterval(intervalId)
      }
    }
  }, [continuousFocus, graphData.isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: GraphContextValue = {
    state,
    actions: {
      ...stateActions,
      ...instanceActions,
      saveCurrentZoom,
      applyCurrentZoom
    },
    data: {
      siteMap: siteMap!,
      postGraphData: graphData.data.postGraph,
      tagGraphData: graphData.data.tagGraph
    },
    instance
  }

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  )
}

export const useGraphContext = () => {
  const context = useContext(GraphContext)
  if (!context) {
    throw new Error('useGraphContext must be used within a GraphProvider')
  }
  return context
}
