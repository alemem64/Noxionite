/**
 * Graph Control API
 * High-level API for external control of graph instances
 * Provides a unified interface for URL-based focusing, hover interactions, and modal state management
 */

import type { GraphViewType } from '../types/graph.types';
import { GRAPH_CONFIG } from '../utils/graphConfig';
import type { SiteMap } from '@/lib/context/types';
import { parseUrlPathname } from '@/lib/context/url-parser';
import { getBlockValue } from 'notion-utils';

export interface GraphControlMessage {
  type: 'fitToHome' | 'focusNode' | 'focusNodes' | 'changeView' | 'highlightNodes' | 'clearHighlight' | 'focusBySlug';
  instanceType: 'sidenav' | 'home';
  payload?: any;
  continuous?: boolean;
}

export interface FocusTarget {
  type: 'node' | 'nodes' | 'category' | 'tag' | 'post';
  id?: string;
  ids?: string[];
  tags?: string[];
}

export interface GraphControlOptions {
  duration?: number;
  padding?: number;
  highlightBorder?: boolean;
}

/**
 * High-level graph control API
 * Manages communication between external components (routing, UI) and graph instances
 */
class GraphControlAPI {
  private instanceState = new Map<string, any>();
  private listeners = new Map<string, Array<(message: any) => void>>();
  private focusIntervals = new Map<string, NodeJS.Timeout>();
  private pendingFitToHome = new Map<string, boolean>();
  private instanceStates = new Map<string, {
    currentView: GraphViewType;
    focusTarget: FocusTarget | null;
    isModalOpen: boolean;
  }>();
  private siteMap: SiteMap | null = null;
  private recordMap: any | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__graphControl = this;
    }
  }

  /**
   * Set the siteMap for accessing page information
   */
  setSiteMap(siteMap: SiteMap) {
    this.siteMap = siteMap;
  }

  /**
   * Set the recordMap for accessing detailed page data including tags
   */
  setRecordMap(recordMap: any) {
    this.recordMap = recordMap;
  }

  /**
   * Get tags for a page by slug using recordMap for accurate tag extraction from ISR cache
   */
  private getTagsBySlug(slug: string): string[] {
    if (!this.siteMap) {
      console.warn('[GraphControl] No siteMap available');
      return [];
    }

  

    // Find page by slug
    const pageInfo = Object.values(this.siteMap.pageInfoMap).find(
      (page) => page.slug === slug
    );

    if (!pageInfo) {
      console.warn(`[GraphControl] No page found for slug: ${slug}`);
      

      
      return [];
    }



    // If we have recordMap, use it to get tags like PostHeader.tsx does
    const blockWrapper =
      this.recordMap?.block?.[pageInfo.pageId] || this.recordMap?.[pageInfo.pageId];
    const block = getBlockValue(blockWrapper);

      
    if (block?.properties) {
        const properties = block.properties;

        
        // Check all possible tag property names
        const possibleTagKeys = ['Tags', 'tags', 'TAGS', 'Tag', 'tag'];
        let tagsProperty = null;
        
        for (const key of possibleTagKeys) {
          if (properties[key]) {
            tagsProperty = properties[key];
            break;
          }
        }
        

        
        if (tagsProperty) {
          let tags: string[] = [];
          
          // Handle different Notion property formats
          if (Array.isArray(tagsProperty)) {
            tags = tagsProperty
              .filter((tag: any) => {
                if (typeof tag === 'string') return tag.trim().length > 0;
                if (tag && typeof tag === 'object') {
                  return tag.name && typeof tag.name === 'string' && tag.name.trim().length > 0;
                }
                return false;
              })
              .map((tag: any) => {
                if (typeof tag === 'string') return tag.trim();
                return tag.name.trim();
              });
          } else if (typeof tagsProperty === 'string' && tagsProperty.trim().length > 0) {
            tags = [tagsProperty.trim()];
          } else if (tagsProperty && typeof tagsProperty === 'object') {
            // Handle multi_select format (most common for Notion)
            if (tagsProperty.multi_select) {
              tags = tagsProperty.multi_select
                .map((tag: any) => tag.name || tag)
                .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
                .map((tag: any) => tag.trim());
            } else if (tagsProperty.name && typeof tagsProperty.name === 'string' && tagsProperty.name.trim().length > 0) {
              tags = [tagsProperty.name.trim()];
            } else if (tagsProperty.results) {
              // Handle relation format
              tags = tagsProperty.results
                .filter((tag: any) => tag.title && typeof tag.title === 'string' && tag.title.trim().length > 0)
                .map((tag: any) => tag.title.trim());
            }
          }
          

          return tags;
        }
    }

    // Fallback to pageInfo.tags if recordMap is not available
    const rawTags = pageInfo.tags || [];
    
    // Process tags similar to PostHeader.tsx logic
    let tags: string[] = [];
    
    if (Array.isArray(rawTags)) {
      tags = rawTags
        .filter((tag: unknown) => typeof tag === 'string' && (tag as string).trim().length > 0)
        .map((tag: unknown) => (tag as string).trim());
    } else if (typeof rawTags === 'string' && (rawTags as string).trim().length > 0) {
      tags = [(rawTags as string).trim()];
    } else if (rawTags && typeof rawTags === 'object') {
      // Handle multi_select format from Notion
      const tagObj = rawTags as Record<string, any>;
      if (tagObj.multi_select) {
        tags = tagObj.multi_select
          .map((tag: any) => tag.name || tag)
          .filter((tag: unknown) => typeof tag === 'string' && (tag as string).trim().length > 0)
          .map((tag: unknown) => (tag as string).trim());
      } else if (tagObj.name && typeof tagObj.name === 'string' && (tagObj.name as string).trim().length > 0) {
        tags = [(tagObj.name as string).trim()];
      }
    }


    return tags;
  }

  /**
   * Send control message to specific graph instance
   */
  private sendMessage(message: GraphControlMessage) {
    const listeners = this.listeners.get(message.instanceType) || [];
    listeners.forEach(listener => listener(message));
  }

  /**
   * Register listener for specific instance
   */
  addListener(instanceType: string, callback: (message: GraphControlMessage) => void) {
    if (!this.listeners.has(instanceType)) {
      this.listeners.set(instanceType, []);
    }
    this.listeners.get(instanceType)!.push(callback);
  }

  /**
   * Remove listener for specific instance
   */
  removeListener(instanceType: string, callback: (message: GraphControlMessage) => void) {
    const listeners = this.listeners.get(instanceType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Update instance state
   */
  updateInstanceState(instanceType: string, state: Partial<{
    currentView: GraphViewType;
    focusTarget: FocusTarget | null;
    isModalOpen: boolean;
  }>) {
    const current = this.instanceStates.get(instanceType) || {
      currentView: 'post_view',
      focusTarget: null,
      isModalOpen: false,
    };
    
    this.instanceStates.set(instanceType, { ...current, ...state });
  }

  

  /**
   * Handle initial URL-based focus when graph first loads
   */
  handleUrlInitialFocus(pathname: string, instanceType: 'sidenav' | 'home' = 'sidenav') {
    const { segment, slug } = parseUrlPathname(pathname);
    
    if (!segment) {
      this.changeView('post_view', instanceType);
      this.scheduleFitToHome(instanceType);
      return;
    }

    // Store the initial focus request to be processed when graph is ready
    this.setInitialFocusRequest({ segment, slug, instanceType });
  }

  /**
   * Store initial focus request for processing when graph is ready
   */
  private setInitialFocusRequest(request: { segment: string; slug: string; instanceType: 'sidenav' | 'home' }) {
    if (typeof window !== 'undefined') {
      // Store in a temporary variable that can be accessed by GraphProvider
      if (!(window as any).__graphInitialFocus) {
        (window as any).__graphInitialFocus = {};
      }
      (window as any).__graphInitialFocus[request.instanceType] = request;
    }
  }

  /**
   * Process initial focus request when graph is ready
   */
  processInitialFocusWhenReady(instanceType: 'sidenav' | 'home', graphReady: boolean) {

    
    if (!graphReady || typeof window === 'undefined') {

      return;
    }

    const request = (window as any).__graphInitialFocus?.[instanceType];

    
    if (!request) {
  
      return;
    }


    
    // Remove the request to prevent duplicate processing
    delete (window as any).__graphInitialFocus[instanceType];

    // Handle based on segment only (view type independent)
    switch (request.segment) {
      case 'post':  
  
        this.changeViewAndFocusBySlug('post_view', request.slug, instanceType);
        this.highlightBySlug([request.slug], instanceType);
        break;
        
      case 'category':
  
        this.changeViewAndFocusBySlug('post_view', request.slug, instanceType);
        this.highlightBySlug([request.slug], instanceType);
        break;
        
      case 'tag':
        this.changeViewAndFocusNode('tag_view', request.slug, instanceType);
        this.highlightByTag([request.slug], instanceType);
        break;
        
      case 'all-tags':
        this.changeView('tag_view', instanceType);
        this.scheduleFitToHome(instanceType);
        break;
        
      default:
        this.changeView('post_view', instanceType);
        this.scheduleFitToHome(instanceType);
        break;
    }
  }

  /**
   * Schedule fitToHome to run after graph is ready
   */
  scheduleFitToHome(instanceType: 'sidenav' | 'home' = 'sidenav') {
    this.pendingFitToHome.set(instanceType, true);
  }

  /**
   * Process pending fitToHome operations when graph becomes ready
   */
  processPendingFitToHome(instanceType: 'sidenav' | 'home' = 'sidenav') {
    if (this.pendingFitToHome.get(instanceType)) {
      this.pendingFitToHome.set(instanceType, false);
      this.fitToHome(instanceType);
    }
  }

  /**
   * Handle URL-based routing
   */
  handleUrlCurrentFocus(pathname: string, instanceType: 'sidenav' | 'home' = 'sidenav', currentView?: GraphViewType, continuousFocus = false) {
  
    
    const { segment, slug } = parseUrlPathname(pathname);
    
    if (!segment) {
  
      return;
    }

    // Use provided currentView or fallback to instance state
    const effectiveCurrentView = currentView || this.instanceStates.get(instanceType)?.currentView || 'post_view';
    


    // Handle based on segment and view type
    switch (segment) {
      case 'post':
        if (effectiveCurrentView === 'post_view' && slug) {
          // Post segment with post_view: implement focus functionality
          this.changeViewAndFocusBySlug('post_view', slug, instanceType, undefined, continuousFocus);
          this.highlightBySlug([slug], instanceType);
        } else if (effectiveCurrentView === 'tag_view' && slug) {
          // Post segment with tag_view: extract tags and focus on them
          const tags = this.getTagsBySlug(slug);
          if (tags.length > 0) {
      
            this.changeViewAndFocusNode('tag_view', tags, instanceType, undefined, continuousFocus);
            this.highlightByTag(tags, instanceType);
          } else {
            this.changeView('tag_view', instanceType);
          }
        }
        break;
        
      case 'category':
        if (effectiveCurrentView === 'post_view') {
          // Category segment with post_view: TODO - implement later
          this.changeViewAndFocusBySlug('post_view', slug, instanceType, undefined, continuousFocus);
          this.highlightBySlug([slug], instanceType);
        } else if (effectiveCurrentView === 'tag_view') {
          // Do nothing
        }
        break;
        
      case 'tag':
        if (effectiveCurrentView === 'post_view') {
          // Do nothing
        } else if (effectiveCurrentView === 'tag_view' && slug) {
          this.changeViewAndFocusBySlug('tag_view', slug, instanceType, undefined, continuousFocus);
          this.highlightByTag([slug], instanceType);
        }
        break;
        
      default:
        break;
    }
  }

  /**
   * High-level control methods
   */
  fitToHome(instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions) {
    this.sendMessage({
      type: 'fitToHome',
      instanceType,
      payload: options
    });
  }

  focusOnTarget(target: FocusTarget, instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions) {
    switch (target.type) {
      case 'node':
      case 'post':
      case 'category':
        if (target.id) {
          this.focusBySlug(target.id, instanceType, options);
        }
        break;
      case 'tag':
        if (target.id) {
          this.focusNode(target.id, instanceType, options);
        }
        break;
      case 'nodes':
        if (target.ids) {
          this.focusNodes(target.ids, instanceType, options);
        }
        break;
    }
  }

  focusNode(nodeId: string, instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions) {
    this.sendMessage({
      type: 'focusNode',
      instanceType,
      payload: { nodeId, options }
    });
  }

  focusBySlug(slug: string, instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions) {
    this.sendMessage({
      type: 'focusBySlug',
      instanceType,
      payload: { slug, options }
    });
  }

  focusNodes(nodeIds: string[], instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions) {
    this.sendMessage({
      type: 'focusNodes',
      instanceType,
      payload: { nodeIds, options }
    });
  }

  changeView(view: GraphViewType, instanceType: 'sidenav' | 'home' = 'sidenav') {
    this.updateInstanceState(instanceType, { 
      currentView: view,
    });
    this.sendMessage({
      type: 'changeView',
      instanceType,
      payload: { view }
    });
  }

  /**
   * Sequential operation: change view and then focus by slug(s) with continuous retry
   */
  changeViewAndFocusBySlug(view: GraphViewType, slug: string | string[], instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions, continuous?: boolean) {
    const currentState = this.instanceStates.get(instanceType);
    const needsViewChange = !currentState || currentState.currentView !== view;
    
    if (needsViewChange) {
      this.changeView(view, instanceType);
    }
    
    // Normalize slug to array
    const slugs = Array.isArray(slug) ? slug : [slug];


    
    setTimeout(() => {
      if (slugs.length === 1) {
        // Single slug: use existing behavior
        this.sendMessage({
          type: 'focusBySlug',
          instanceType,
          payload: { slug: slugs[0], options, continuous: continuous ?? needsViewChange }
        });
      } else {
        // Multiple slugs: use focusBySlug with array for zoom-to-fit
        this.sendMessage({
          type: 'focusBySlug',
          instanceType,
          payload: { slugs, options: { ...options, continuous: continuous ?? needsViewChange } }
        });
      }
    }, needsViewChange ? 50 : 0);
  }



  /**
   * Sequential operation: change view and then focus node(s) with continuous retry
   */
  changeViewAndFocusNode(view: GraphViewType, nodeId: string | string[], instanceType: 'sidenav' | 'home' = 'sidenav', options?: GraphControlOptions, continuous?: boolean) {
    const currentState = this.instanceStates.get(instanceType);
    const needsViewChange = !currentState || currentState.currentView !== view;
    
    // Normalize nodeId to array
    const nodeIds = Array.isArray(nodeId) ? nodeId : [nodeId];
    
    if (needsViewChange) {
      this.changeView(view, instanceType);
    }
    
    // Always use continuous retry when view type changes (regardless of same/different)
    setTimeout(() => {
      if (nodeIds.length === 1) {
        // Single node: use existing behavior
        this.sendMessage({
          type: 'focusNode',
          instanceType,
          payload: { nodeId: nodeIds[0], options, continuous: continuous ?? true }
        });
      } else {
        // Multiple nodes: use focusNodes for zoom-to-fit
        this.sendMessage({
          type: 'focusNodes',
          instanceType,
          payload: { nodeIds, options: { ...options, continuous: continuous ?? true } }
        });
      }
    }, needsViewChange ? 50 : 0);
  }

  /**
   * Handle modal open/close events
   */
  handleModalToggle(isOpen: boolean, instanceType: 'sidenav' | 'home' = 'sidenav') {
    this.updateInstanceState(instanceType, { isModalOpen: isOpen });
    
    // When modal opens/closes, maintain focus if available
    const state = this.instanceStates.get(instanceType);
    if (state?.focusTarget) {
      this.focusOnTarget(state.focusTarget, instanceType);
    } else {
      this.fitToHome(instanceType);
    }
  }


  /**
   * Highlight nodes by slug (for post view)
   */
  highlightBySlug(slugs: string[], instanceType: 'sidenav' | 'home' = 'sidenav') {
    this.sendMessage({
      type: 'highlightNodes',
      instanceType,
      payload: {
        type: 'slug',
        values: slugs
      }
    });
  }

  /**
   * Highlight nodes by tag (for tag view)
   */
  highlightByTag(tags: string[], instanceType: 'sidenav' | 'home' = 'sidenav') {
    this.sendMessage({
      type: 'highlightNodes',
      instanceType,
      payload: {
        type: 'tag',
        values: tags
      }
    });
  }

  /**
   * Clear all highlights
   */
  clearHighlight(instanceType: 'sidenav' | 'home' = 'sidenav') {
    this.sendMessage({
      type: 'clearHighlight',
      instanceType,
      payload: {}
    });
  }

  /**
   * Get instance state for a specific instance type
   */
  getInstanceState(instanceType: string) {
    return this.instanceStates.get(instanceType);
  }

  /**
   * Debug helpers for development
   */
  debug() {
    // Debug method kept for potential use
  }
}

/**
 * Calculate optimal zoom level to fit multiple nodes within canvas bounds
 * @param bounds - Bounding box containing minX, maxX, minY, maxY coordinates
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param padding - Padding around the bounding box in pixels
 * @returns Optimal zoom level
 */
export function calculateZoomLevel(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  canvasWidth: number,
  canvasHeight: number,
  paddingInPixels: number = GRAPH_CONFIG.zoom.DEFAULT_PADDING
): number {
  const { minX, maxX, minY, maxY } = bounds;

  const width = maxX - minX;
  const height = maxY - minY;



  // When all nodes are at a single point (width/height is 0)
  if (width === 0 && height === 0) {

    return 5; // Return appropriate default zoom level
  }

  const targetCanvasWidth = canvasWidth * GRAPH_CONFIG.zoom.MULTIPLE_ZOOM_RATIO;
  const targetCanvasHeight = canvasHeight * GRAPH_CONFIG.zoom.MULTIPLE_ZOOM_RATIO;



  // 1. Assuming no padding, calculate the 'base zoom level' to fit node bounding box to target canvas area
  // This zoom level becomes the conversion ratio between 'graph coordinate units' and 'pixels'
  const zoomXWithoutPadding = targetCanvasWidth / (width || 1);
  const zoomYWithoutPadding = targetCanvasHeight / (height || 1);



  // Choose the smaller zoom level since both axes must fit within the screen
  const baseZoom = Math.min(zoomXWithoutPadding, zoomYWithoutPadding);



  // 2. Convert desired padding in 'pixel' units to 'graph coordinate' units
  // For example, if baseZoom is 5, then 1 graph unit = 5 pixels
  // Therefore, 20px padding becomes 20/5 = 4 graph units
  const paddingInGraphUnits = paddingInPixels / baseZoom;



  // 3. Apply converted graph unit padding to calculate effective width/height
  const effectiveWidth = width + (paddingInGraphUnits * 2);
  const effectiveHeight = height + (paddingInGraphUnits * 2);



  // 4. Recalculate the final zoom level 
  const finalZoomX = targetCanvasWidth / effectiveWidth;
  const finalZoomY = targetCanvasHeight / effectiveHeight;

  const finalZoom = Math.min(finalZoomX, finalZoomY);



  return Math.max(0.1, Math.min(finalZoom, 10));
}

export const graphControl = new GraphControlAPI();
