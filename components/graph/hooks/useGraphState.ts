import { useState, useCallback } from 'react'
import type {
  GraphState,
  GraphViewType,
  GraphDisplayType,
  ZoomState
} from '../types/graph.types'

export const useGraphState = () => {
  const [state, setState] = useState<GraphState>(() => ({
    currentView: 'post_view',
    displayType: 'home',
    isModalOpen: false,
    zoomState: {
      post_view: { zoom: 1, center: { x: 0, y: 0 } },
      tag_view: { zoom: 1, center: { x: 0, y: 0 } }
    },
    isGraphLoaded: false,
    currentTag: undefined,
    highlightSlugs: [],
    highlightTags: []
  }))

  const setCurrentView = useCallback((view: GraphViewType) => {
    setState((prev) => ({ ...prev, currentView: view }))
  }, [])

  const setDisplayType = useCallback((type: GraphDisplayType) => {
    setState((prev) => ({ ...prev, displayType: type }))
  }, [])

  const openModal = useCallback(() => {
    setState((preve) => ({ ...preve, isModalOpen: true }))
  }, [])

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, isModalOpen: false }))
  }, [])

  const setZoomStateForView = useCallback(
    (view: GraphViewType, zoom: ZoomState) => {
      setState((prev) => ({
        ...prev,
        zoomState: {
          ...prev.zoomState,
          [view]: zoom
        }
      }))
    },
    []
  )

  const setIsGraphLoaded = useCallback((loaded: boolean) => {
    setState((prev) => ({ ...prev, isGraphLoaded: loaded }))
  }, [])

  const setCurrentTag = useCallback((tag?: string) => {
    setState((prev) => ({ ...prev, currentTag: tag }))
  }, [])

  const setHighlightSlugs = useCallback((slugs: string[]) => {
    setState((prev) => ({ ...prev, highlightSlugs: slugs }))
  }, [])

  const setHighlightTags = useCallback((tags: string[]) => {
    setState((prev) => ({ ...prev, highlightTags: tags }))
  }, [])

  const clearHighlight = useCallback(() => {
    setState((prev) => ({ ...prev, highlightSlugs: [], highlightTags: [] }))
  }, [])

  const resetZoomState = useCallback((view?: GraphViewType) => {
    if (view) {
      setState((prev) => {
        const newZoomState = { ...prev.zoomState }
        delete newZoomState[view]
        return { ...prev, zoomState: newZoomState }
      })
    } else {
      setState((prev) => ({ ...prev, zoomState: {} }))
    }
  }, [])

  return {
    state,
    actions: {
      setCurrentView,
      setDisplayType,
      openModal,
      closeModal,
      setZoomStateForView,
      setIsGraphLoaded,
      setCurrentTag,
      setHighlightSlugs,
      setHighlightTags,
      clearHighlight,
      resetZoomState
    }
  }
}
