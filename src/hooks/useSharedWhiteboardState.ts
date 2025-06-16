
/**
 * @fileoverview Shared whiteboard state management for collaborative sessions
 * @description Coordinates whiteboard operations with real-time synchronization capabilities.
 * This is the primary state hook for collaborative whiteboards with sync functionality.
 * 
 * @usage
 * ```tsx
 * const syncConfig = { whiteboardId: 'session-123', senderId: 'user-456' };
 * const whiteboard = useSharedWhiteboardState(syncConfig, 'whiteboard-id');
 * ```
 * 
 * @ai-context This hook extends basic whiteboard functionality with:
 * - Real-time synchronization via WebSockets
 * - Multi-user collaboration features
 * - Conflict resolution for simultaneous edits
 * - Session-based persistence
 */

import { useCallback, useMemo } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSharedWhiteboardCore } from './shared/useSharedWhiteboardCore';
import { useSharedNormalizedState } from './shared/useSharedNormalizedState';
import { useSharedOperationsHandler } from './shared/useSharedOperationsHandler';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

/**
 * @hook useSharedWhiteboardState
 * @description Main hook for collaborative whiteboard state management
 * 
 * @param syncConfig - Configuration for real-time synchronization
 * @param whiteboardId - Unique identifier for this whiteboard instance
 * @param containerWidth - Width of the container for centering calculations
 * @param containerHeight - Height of the container for centering calculations
 * 
 * @returns {Object} Extended whiteboard state with collaboration features
 * @returns {WhiteboardState} state - Current whiteboard state
 * @returns {SyncState} syncState - Real-time synchronization status
 * @returns {boolean} isReadOnly - Whether this instance is read-only
 * @returns {string} whiteboardId - The whiteboard identifier
 * @returns {Function} getLastActivity - Get the most recent activity metadata
 * 
 * @ai-understanding
 * This hook orchestrates multiple collaboration-specific hooks:
 * - useSharedWhiteboardCore: Core state and basic operations
 * - useSharedNormalizedState: Performance optimization state
 * - useSharedOperationsHandler: Coordinates operations, persistence, and pointer handling
 */
export const useSharedWhiteboardState = (syncConfig?: SyncConfig, whiteboardId?: string, containerWidth?: number, containerHeight?: number) => {
  debugLog('Hook', 'Initializing useSharedWhiteboardState', { 
    syncConfig: syncConfig ? 'provided' : 'none',
    whiteboardId 
  });

  // Core state management
  const coreState = useSharedWhiteboardCore(whiteboardId);
  const { state, setState, selection, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth, panZoom } = coreState;

  // Normalized state for performance optimization
  const normalizedState = useSharedNormalizedState(state.lines, state.images, whiteboardId);

  // Operations handling
  const operationsHandler = useSharedOperationsHandler(syncConfig, state, setState, panZoom, selection, whiteboardId);
  const { operations, handlePointerDown, handlePointerMove, handlePointerUp, deleteSelectedObjects } = operationsHandler;

  const isReadOnly = syncConfig?.isReceiveOnly || false;

  // Memoize container dimensions to prevent unnecessary rerenders
  const stableContainerDimensions = useMemo(() => ({
    width: containerWidth,
    height: containerHeight
  }), [containerWidth, containerHeight]);

  // Enhanced centering function that uses viewport dimensions - properly memoized
  const centerOnLastActivity = useCallback((bounds: { x: number; y: number; width: number; height: number }) => {
    if (!panZoom.centerOnBounds || !stableContainerDimensions.width || !stableContainerDimensions.height) {
      console.log('[SharedWhiteboardState] Cannot center - missing centerOnBounds or dimensions');
      return;
    }
    
    console.log('[SharedWhiteboardState] Centering on bounds:', bounds);
    console.log('[SharedWhiteboardState] Container dimensions:', stableContainerDimensions);
    
    panZoom.centerOnBounds(bounds, stableContainerDimensions.width, stableContainerDimensions.height);
  }, [panZoom.centerOnBounds, stableContainerDimensions.width, stableContainerDimensions.height]);
  
  debugLog('Hook', 'useSharedWhiteboardState initialized', {
    isReadOnly,
    hasSync: !!syncConfig,
    whiteboardId,
    hasLastActivity: !!operations.getLastActivity?.()
  });

  return {
    state,
    // Expose normalized state for components that can use it
    normalizedState,
    syncState: operations.syncState,
    setTool,
    setColor,
    setPencilColor,
    setHighlighterColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePaste: operations.handlePaste,
    addToHistory: operations.addToHistory,
    undo: operations.undo,
    redo: operations.redo,
    canUndo: operations.canUndo,
    canRedo: operations.canRedo,
    getLastActivity: operations.getLastActivity,
    centerOnLastActivity,
    panZoom,
    updateImageState: operations.updateImageState,
    updateLine: operations.updateLine,
    updateImage: operations.updateImage,
    toggleImageLock: operations.toggleImageLock,
    deleteSelectedObjects,
    selection,
    isReadOnly,
    whiteboardId // Expose whiteboard ID for component identification
  };
};
