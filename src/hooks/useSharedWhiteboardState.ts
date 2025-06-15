
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
import { useSelectionState } from './useSelectionState';
import { usePanZoom } from './usePanZoom';
import { useSharedStateManagement } from './shared/useSharedStateManagement';
import { useSharedPointerHandlers } from './shared/useSharedPointerHandlers';
import { useSharedStateInitialization } from './shared/useSharedStateInitialization';
import { useSharedPersistenceIntegration } from './shared/useSharedPersistenceIntegration';
import { useSharedOperationsCoordinator } from './shared/useSharedOperationsCoordinator';
import { useNormalizedWhiteboardState } from './performance/useNormalizedWhiteboardState';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
const USE_NORMALIZED_STATE = true; // Feature flag for gradual rollout

/**
 * @function debugLog
 * @description Debug logging for shared whiteboard operations
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[SharedWhiteboardState:${context}] ${action}`, data || '');
  }
};

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
 * 
 * @ai-understanding
 * This hook orchestrates multiple collaboration-specific hooks:
 * - useSharedStateInitialization: Sets up initial state with persistence
 * - useSharedOperationsCoordinator: Manages drawing/sync/history operations
 * - useSharedPersistenceIntegration: Handles database persistence
 * - useSharedPointerHandlers: Coordinates pointer events with sync
 */
export const useSharedWhiteboardState = (syncConfig?: SyncConfig, whiteboardId?: string) => {
  debugLog('Hook', 'Initializing useSharedWhiteboardState', { 
    syncConfig: syncConfig ? 'provided' : 'none',
    whiteboardId 
  });

  // Initialize state
  const { state, setState } = useSharedStateInitialization(whiteboardId);

  // Normalized state for performance optimization
  const normalizedState = useNormalizedWhiteboardState(state.lines, state.images);

  if (DEBUG_ENABLED && USE_NORMALIZED_STATE) {
    debugLog('Performance', 'Normalized state stats', {
      lineCount: normalizedState.lineCount,
      imageCount: normalizedState.imageCount,
      totalObjects: normalizedState.totalObjectCount,
      whiteboardId
    });
  }

  // Selection state management
  const selection = useSelectionState();

  // Coordinate all operations (drawing, sync, history, etc.) with whiteboard ID
  const operations = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);

  // Handle persistence and context integration
  useSharedPersistenceIntegration(state, setState, syncConfig, whiteboardId);

  // State management functions
  const { setPanZoomState, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth } = useSharedStateManagement(setState);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Pointer event handlers with proper safety checks
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useSharedPointerHandlers(
    state, 
    operations.startDrawing, 
    operations.continueDrawing, 
    operations.stopDrawing, 
    operations.startErasing, 
    operations.continueErasing, 
    operations.stopErasing,
    syncConfig, 
    panZoom, 
    selection
  );

  /**
   * @function deleteSelectedObjects
   * @description Deletes currently selected objects and syncs the operation
   * 
   * @ai-context This wrapper ensures proper cleanup of selection state
   * after deletion and triggers history recording.
   */
  const deleteSelectedObjects = useCallback(() => {
    const selectedObjects = selection.selectionState.selectedObjects;
    debugLog('Delete', 'Delete selected objects requested', { 
      count: selectedObjects?.length || 0 
    });
    
    if (selectedObjects && operations.deleteSelectedObjects) {
      operations.deleteSelectedObjects(selectedObjects);
      selection.clearSelection();
      debugLog('Delete', 'Objects deleted and selection cleared');
    }
  }, [selection, operations]);

  const isReadOnly = syncConfig?.isReceiveOnly || false;
  
  debugLog('Hook', 'useSharedWhiteboardState initialized', {
    isReadOnly,
    hasSync: !!syncConfig,
    whiteboardId
  });

  return {
    state,
    // Expose normalized state for components that can use it
    normalizedState: USE_NORMALIZED_STATE ? normalizedState : undefined,
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
