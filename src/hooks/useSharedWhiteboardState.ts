
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

import { useCallback, useRef } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSelectionState } from './useSelectionState';
import { usePanZoom } from './usePanZoom';
import { useSharedStateManagement } from './shared/useSharedStateManagement';
import { useSharedPointerHandlers } from './shared/useSharedPointerHandlers';
import { useSharedStateInitialization } from './shared/useSharedStateInitialization';
import { useSharedPersistenceIntegration } from './shared/useSharedPersistenceIntegration';
import { useSharedOperationsCoordinator } from './shared/useSharedOperationsCoordinator';
import { useNormalizedWhiteboardState } from './performance/useNormalizedWhiteboardState';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');
const USE_NORMALIZED_STATE = true; // Feature flag for gradual rollout

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
  // Prevent duplicate initializations
  const initializationRef = useRef<string | null>(null);
  const currentId = syncConfig?.whiteboardId || whiteboardId;
  
  if (initializationRef.current !== currentId) {
    debugLog('Hook', 'Initializing useSharedWhiteboardState', { 
      syncConfig: syncConfig ? 'provided' : 'none',
      whiteboardId: currentId,
      previousId: initializationRef.current
    });
    initializationRef.current = currentId;
  }

  // Add initialization state tracking
  const isInitializing = useRef(true);

  // Initialize state with safety checks
  let state, setState;
  try {
    console.log('[StateInit] Starting state initialization for:', currentId);
    const stateInit = useSharedStateInitialization(whiteboardId);
    state = stateInit.state;
    setState = stateInit.setState;
    console.log('[StateInit] State initialization completed for:', currentId);
  } catch (error) {
    console.error('[StateInit] State initialization failed:', error);
    throw error;
  }

  // Normalized state for performance optimization with safety
  let normalizedState;
  try {
    if (USE_NORMALIZED_STATE && state?.lines && state?.images) {
      normalizedState = useNormalizedWhiteboardState(state.lines, state.images);
      debugLog('Performance', 'Normalized state stats', {
        lineCount: normalizedState.lineCount,
        imageCount: normalizedState.imageCount,
        totalObjects: normalizedState.totalObjectCount,
        whiteboardId: currentId
      });
    }
  } catch (error) {
    debugLog('Performance', 'Normalized state creation failed, continuing without optimization', { error: error.message });
    normalizedState = undefined;
  }

  // Selection state management with safety
  let selection;
  try {
    console.log('[Selection] Starting selection state initialization');
    selection = useSelectionState();
    console.log('[Selection] Selection state initialization completed');
  } catch (error) {
    console.error('[Selection] Selection state initialization failed:', error);
    throw error;
  }

  // Coordinate all operations with safety checks
  let operations;
  try {
    console.log('[Operations] Starting operations coordinator initialization');
    operations = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);
    console.log('[Operations] Operations coordinator initialization completed');
  } catch (error) {
    console.error('[Operations] Operations coordinator initialization failed:', error);
    throw error;
  }

  // Handle persistence and context integration with safety
  try {
    console.log('[Persistence] Starting persistence integration');
    useSharedPersistenceIntegration(state, setState, syncConfig, whiteboardId);
    console.log('[Persistence] Persistence integration completed');
  } catch (error) {
    console.error('[Persistence] Persistence integration failed:', error);
    // Don't throw here, persistence is not critical for basic functionality
  }

  // State management functions with safety
  let setPanZoomState, setTool, setColor, setPencilColor, setHighlighterColor, setStrokeWidth;
  try {
    console.log('[StateManagement] Starting state management initialization');
    const stateManagement = useSharedStateManagement(setState);
    setPanZoomState = stateManagement.setPanZoomState;
    setTool = stateManagement.setTool;
    setColor = stateManagement.setColor;
    setPencilColor = stateManagement.setPencilColor;
    setHighlighterColor = stateManagement.setHighlighterColor;
    setStrokeWidth = stateManagement.setStrokeWidth;
    console.log('[StateManagement] State management initialization completed');
  } catch (error) {
    console.error('[StateManagement] State management initialization failed:', error);
    throw error;
  }

  // Pan/zoom operations with safety
  let panZoom;
  try {
    console.log('[PanZoom] Starting pan/zoom initialization');
    panZoom = usePanZoom(state.panZoomState, setPanZoomState);
    console.log('[PanZoom] Pan/zoom initialization completed');
  } catch (error) {
    console.error('[PanZoom] Pan/zoom initialization failed:', error);
    throw error;
  }

  // Pointer event handlers with safety checks
  let handlePointerDown, handlePointerMove, handlePointerUp;
  try {
    console.log('[PointerHandlers] Starting pointer handlers initialization');
    const pointerHandlers = useSharedPointerHandlers(
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
    handlePointerDown = pointerHandlers.handlePointerDown;
    handlePointerMove = pointerHandlers.handlePointerMove;
    handlePointerUp = pointerHandlers.handlePointerUp;
    console.log('[PointerHandlers] Pointer handlers initialization completed');
  } catch (error) {
    console.error('[PointerHandlers] Pointer handlers initialization failed:', error);
    throw error;
  }

  /**
   * @function deleteSelectedObjects
   * @description Deletes currently selected objects and syncs the operation
   * 
   * @ai-context This wrapper ensures proper cleanup of selection state
   * after deletion and triggers history recording.
   */
  const deleteSelectedObjects = useCallback(() => {
    try {
      const selectedObjects = selection.selectionState.selectedObjects;
      debugLog('Delete', 'Delete selected objects requested', { 
        count: selectedObjects?.length || 0 
      });
      
      if (selectedObjects && operations.deleteSelectedObjects) {
        operations.deleteSelectedObjects(selectedObjects);
        selection.clearSelection();
        debugLog('Delete', 'Objects deleted and selection cleared');
      }
    } catch (error) {
      console.error('[Delete] Delete selected objects failed:', error);
    }
  }, [selection, operations]);

  const isReadOnly = syncConfig?.isReceiveOnly || false;
  
  // Mark initialization as complete
  isInitializing.current = false;
  
  console.log('[SharedWhiteboardState] Initialization completed successfully for:', currentId);
  
  debugLog('Hook', 'useSharedWhiteboardState initialized', {
    isReadOnly,
    hasSync: !!syncConfig,
    whiteboardId: currentId
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
    whiteboardId: currentId // Expose whiteboard ID for component identification
  };
};
