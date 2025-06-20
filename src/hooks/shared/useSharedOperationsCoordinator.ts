
/**
 * @fileoverview Coordinates all whiteboard operations for shared state
 * @description Central coordination point for drawing, syncing, history, and image operations
 * in collaborative whiteboard scenarios.
 * 
 * @ai-context This hook acts as the operations dispatcher, routing different types
 * of operations to their appropriate handlers while maintaining synchronization.
 */

import { useCallback, useRef, useMemo } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState, ActivityMetadata } from '@/types/whiteboard';
import { useHistoryState } from '../useHistoryState';
import { useSyncState } from '../useSyncState';
import { useRemoteOperationHandler } from '../useRemoteOperationHandler';
import { useSharedDrawingOperations } from './useSharedDrawingOperations';
import { useSharedImageOperations } from './useSharedImageOperations';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('operations');

/**
 * @hook useSharedOperationsCoordinator
 * @description Coordinates all whiteboard operations with synchronization
 * 
 * @param syncConfig - Optional sync configuration for real-time collaboration
 * @param state - Current whiteboard state
 * @param setState - State setter function
 * @param whiteboardId - Unique identifier for this whiteboard
 * 
 * @returns {Object} Coordinated operations interface
 * @returns {SyncState} syncState - Real-time sync status
 * @returns {Function} addToHistory - Add current state to history
 * @returns {Function} undo - Undo last operation
 * @returns {Function} redo - Redo last undone operation
 * @returns {Function} getLastActivity - Get the most recent activity metadata
 * @returns {DrawingOperations} Drawing operations (start/continue/stop)
 * @returns {ImageOperations} Image operations (paste/update/toggle lock)
 * 
 * @ai-understanding
 * This coordinator:
 * 1. Sets up sync infrastructure if config provided
 * 2. Manages remote operation handling
 * 3. Coordinates history operations (single source of truth)
 * 4. Delegates to specialized operation handlers
 * 5. Ensures proper whiteboard identification
 */
export const useSharedOperationsCoordinator = (
  syncConfig: SyncConfig | undefined,
  state: WhiteboardState,
  setState: (updater: (prev: WhiteboardState) => WhiteboardState) => void,
  whiteboardId?: string
) => {
  debugLog('Hook', 'Initializing operations coordinator', {
    hasSync: !!syncConfig,
    whiteboardId,
    isReceiveOnly: syncConfig?.isReceiveOnly
  });

  // Create a ref for isApplyingRemoteOperation to share between handlers
  const isApplyingRemoteOperationRef = useRef(false);

  // Memoize the actual whiteboard ID to prevent re-computations
  const actualWhiteboardId = useMemo(() => {
    return syncConfig?.whiteboardId || whiteboardId;
  }, [syncConfig?.whiteboardId, whiteboardId]);

  // Handle remote operations with undo/redo support - memoize handler
  const { handleRemoteOperation } = useRemoteOperationHandler(
    setState, 
    // Use placeholder functions that will be replaced after history setup
    () => {}, // undo placeholder
    () => {}, // redo placeholder
    isApplyingRemoteOperationRef
  );

  // Set up sync if config is provided - memoize the handleRemoteOperation to prevent re-initialization
  const stableHandleRemoteOperation = useCallback((operation: any) => {
    handleRemoteOperation(operation);
  }, [handleRemoteOperation]);

  const { syncState, sendOperation } = syncConfig 
    ? useSyncState(syncConfig, stableHandleRemoteOperation)
    : { syncState: null, sendOperation: null };

  debugLog('Sync', 'Sync state initialized', {
    isConnected: syncState?.isConnected,
    canSend: !!sendOperation
  });

  // SINGLE history state with conditional sync integration
  // Pass sendOperation only if sync is enabled (Teacher1-Student1 pair)
  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastActivity
  } = useHistoryState(state, setState, undefined, syncConfig ? sendOperation : null);

  /**
   * @function addToHistoryWithActivity
   * @description Enhanced history function that includes sync context
   * 
   * @ai-context This wrapper adds debug logging and ensures consistent
   * history snapshots across collaborative sessions.
   */
  const addToHistoryWithActivity = useCallback((snapshot?: any, activityMetadata?: ActivityMetadata) => {
    debugLog('History', 'Adding to history', {
      linesCount: state.lines.length,
      imagesCount: state.images.length,
      hasSelection: state.selectionState.selectedObjects.length > 0,
      hasActivity: !!activityMetadata
    });
    
    const finalSnapshot = snapshot || {
      lines: state.lines,
      images: state.images,
      selectionState: state.selectionState
    };
    
    addToHistory(finalSnapshot, activityMetadata);
  }, [addToHistory, state.lines, state.images, state.selectionState]);

  // Drawing and erasing operations with whiteboard ID - memoize to prevent re-initialization
  debugLog('Operations', 'Setting up drawing operations', { actualWhiteboardId });
  const drawingOperations = useSharedDrawingOperations(
    state, setState, addToHistoryWithActivity, sendOperation, isApplyingRemoteOperationRef, actualWhiteboardId
  );

  // Image operations with proper parameter handling - memoize to prevent re-initialization
  debugLog('Operations', 'Setting up image operations', { actualWhiteboardId });
  const imageOperations = useSharedImageOperations(
    state, setState, addToHistoryWithActivity, sendOperation, isApplyingRemoteOperationRef, actualWhiteboardId
  );

  debugLog('Hook', 'Operations coordinator initialized', {
    hasDrawing: !!drawingOperations.startDrawing,
    hasImages: !!imageOperations.handlePaste,
    canUndo,
    canRedo,
    hasLastActivity: !!getLastActivity()
  });

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    syncState,
    addToHistory: addToHistoryWithActivity, // Keep this for drawing operations
    undo,
    redo,
    canUndo,
    canRedo,
    getLastActivity,
    ...drawingOperations,
    ...imageOperations
  }), [
    syncState,
    addToHistoryWithActivity,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastActivity,
    drawingOperations,
    imageOperations
  ]);
};
