
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

import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSharedWhiteboardCore } from './shared/useSharedWhiteboardCore';
import { useSharedNormalizedState } from './shared/useSharedNormalizedState';
import { useSharedOperationsHandler } from './shared/useSharedOperationsHandler';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

/**
 * @hook useSharedWhiteboardState
 * @description Main hook for collaborative whiteboard state management
 * 
 * @param syncConfig - Configuration for real-time synchronization
 * @param whiteboardId - Unique identifier for this whiteboard instance
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
    whiteboardId,
    isReceiveOnly: syncConfig?.isReceiveOnly
  });

  // Core state management
  const coreState = useSharedWhiteboardCore(whiteboardId);
  const { state, setState, selection, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth, panZoom } = coreState;

  // Normalized state for performance optimization
  const normalizedState = useSharedNormalizedState(state.lines, state.images, whiteboardId);

  // Operations handling
  const operationsHandler = useSharedOperationsHandler(syncConfig, state, setState, panZoom, selection, whiteboardId);
  const { operations, handlePointerDown, handlePointerMove, handlePointerUp, deleteSelectedObjects } = operationsHandler;

  // Use sync config to determine read-only status, with proper fallback
  const isReadOnly = syncConfig?.isReceiveOnly || false;
  
  debugLog('Hook', 'Read-only status determined', {
    isReadOnly,
    whiteboardId,
    syncConfigReceiveOnly: syncConfig?.isReceiveOnly
  });

  // Enhanced centering function that uses viewport dimensions
  const centerOnLastActivity = useCallback((bounds: { x: number; y: number; width: number; height: number }) => {
    if (!panZoom.centerOnBounds || !containerWidth || !containerHeight) {
      debugLog('CenterOnActivity', 'Cannot center - missing dependencies', {
        hasCenterOnBounds: !!panZoom.centerOnBounds,
        containerWidth,
        containerHeight
      });
      return;
    }
    
    debugLog('CenterOnActivity', 'Centering on bounds', {
      bounds,
      containerDimensions: { containerWidth, containerHeight }
    });
    
    panZoom.centerOnBounds(bounds, containerWidth, containerHeight);
  }, [panZoom, containerWidth, containerHeight]);

  // Reduce logging noise for last activity checks
  const currentActivity = operations.getLastActivity?.();
  
  debugLog('Hook', 'useSharedWhiteboardState initialized', {
    isReadOnly,
    hasSync: !!syncConfig,
    whiteboardId,
    hasLastActivity: !!currentActivity
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
