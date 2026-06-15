import type { NodeObject, LinkObject } from 'react-force-graph-2d'
import type { PageInfo, SiteMap } from '@/lib/context/types'

export interface GraphNode extends NodeObject {
  id: string
  name: string
  description?: string
  slug?: string
  type: 'Root' | 'Category' | 'Post' | 'Home' | 'Tag' | 'Database'
  imageUrl?: string
  page?: Partial<PageInfo>
  tag?: string
  count?: number
  img?: HTMLImageElement
  neighbors?: GraphNode[]
  links?: GraphLink[]
  val?: number
}

export interface GraphLink extends LinkObject {
  source: string
  target: string
  value?: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export type GraphViewType = 'post_view' | 'tag_view'
export type GraphDisplayType = 'sidebar' | 'fullscreen' | 'home'

export interface ZoomState {
  zoom: number
  center: { x: number; y: number }
}

export interface GraphState {
  currentView: GraphViewType
  displayType: GraphDisplayType
  isModalOpen: boolean
  zoomState: Record<string, ZoomState>
  isGraphLoaded: boolean
  currentTag?: string
  highlightSlugs: string[]
  highlightTags: string[]
}

export interface GraphContextValue {
  state: GraphState
  actions: {
    setCurrentView: (view: GraphViewType) => void
    setDisplayType: (type: GraphDisplayType) => void
    openModal: () => void
    closeModal: () => void
    setIsGraphLoaded: (loaded: boolean) => void
    setCurrentTag: (tag?: string) => void

    // Instance actions
    zoomToFit: (
      duration?: number,
      padding?: number,
      nodeFilter?: (node: any) => boolean
    ) => void
    zoomToNode: (nodeId: string, duration?: number, padding?: number) => void
    pauseAnimation: () => void
    resumeAnimation: () => void

    // Combined actions
    saveCurrentZoom: () => void
    applyCurrentZoom: (fitView?: boolean) => void
  }
  data: {
    siteMap: SiteMap
    postGraphData: GraphData
    tagGraphData: GraphData
  }
  instance: {
    graphRef: React.RefObject<any>
    setGraphInstance: (instance: any) => void
  }
}
