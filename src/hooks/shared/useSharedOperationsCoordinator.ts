
/**
 * @fileoverview Coordinates all whiteboard operations for shared state
 * @description Central coordination point for drawing, syncing, history, and image operations
 * in collaborative whiteboard scenarios.
 * 
 * @ai-context This hook acts as the operations dispatcher, routing different types
 * of operations to their appropriate handlers while maintaining synchronization.
 */

import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState, ActivityMetadata } from '@/types/whiteboard';
import { useHistoryState } from '../useHistoryState';
import { useSyncState } from '../useSyncState';
import { useRemoteOperationHandler } from '../useRemoteOperationHandler';
import { useSharedDrawingOperations } from './useSharedDrawingOperations';
import { useSharedImageOperations } from './useSharedImageOperations';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Debug logging for operations coordination
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[OperationsCoordinator:${context}] ${action}`, data || '');
  }
};

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
 * 3. Coordinates history operations
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

  // Enhanced history with sync support - pass sendOperation for Teacher1-Student1 sync
  const {
    addToHistory: baseAddToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastActivity
  } = useHistoryState(state, setState, undefined, syncConfig ? null : null); // Will be updated below

  // Set up sync if config is provided
  const { syncState, sendOperation } = syncConfig 
    ? useSyncState(syncConfig, (operation) => handleRemoteOperation(operation))
    : { syncState: null, sendOperation: null };

  debugLog('Sync', 'Sync state initialized', {
    isConnected: syncState?.isConnected,
    canSend: !!sendOperation
  });

  // Update history state with sendOperation for sync
  const {
    addToHistory: syncAddToHistory,
    undo: syncUndo,
    redo: syncRedo,
    canUndo: syncCanUndo,
    canRedo: syncCanRedo,
    getLastActivity: syncGetLastActivity
  } = useHistoryState(state, setState, undefined, sendOperation);

  // Use sync-enabled or local history functions based on sync availability
  const finalAddToHistory = syncConfig ? syncAddToHistory : baseAddToHistory;
  const finalUndo = syncConfig ? syncUndo : undo;
  const finalRedo = syncConfig ? syncRedo : redo;
  const finalCanUndo = syncConfig ? syncCanUndo : canUndo;
  const finalCanRedo = syncConfig ? syncCanRedo : canRedo;
  const finalGetLastActivity = syncConfig ? syncGetLastActivity : getLastActivity;

  // Handle remote operations with undo/redo support
  const { handleRemoteOperation, isApplyingRemoteOperation } = useRemoteOperationHandler(
    setState, 
    finalUndo, 
    finalRedo
  );

  /**
   * @function addToHistory
   * @description Enhanced history function that includes sync context
   * 
   * @ai-context This wrapper adds debug logging and ensures consistent
   * history snapshots across collaborative sessions.
   */
  const addToHistory = useCallback((snapshot?: any, activityMetadata?: ActivityMetadata) => {
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
    
    finalAddToHistory(finalSnapshot, activityMetadata);
  }, [finalAddToHistory, state.lines, state.images, state.selectionState]);

  // Drawing and erasing operations with whiteboard ID
  // Use the full whiteboard ID from sync config or fallback to provided ID
  const actualWhiteboardId = syncConfig?.whiteboardId || whiteboardId;
  
  debugLog('Operations', 'Setting up drawing operations', { actualWhiteboardId });
  const drawingOperations = useSharedDrawingOperations(
    state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, actualWhiteboardId
  );

  // Image operations with proper parameter handling
  debugLog('Operations', 'Setting up image operations', { actualWhiteboardId });
  const imageOperations = useSharedImageOperations(
    state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, actualWhiteboardId
  );

  debugLog('Hook', 'Operations coordinator initialized', {
    hasDrawing: !!drawingOperations.startDrawing,
    hasImages: !!imageOperations.handlePaste,
    canUndo: finalCanUndo,
    canRedo: finalCanRedo,
    hasLastActivity: !!finalGetLastActivity()
  });

  return {
    syncState,
    addToHistory,
    undo: finalUndo,
    redo: finalRedo,
    canUndo: finalCanUndo,
    canRedo: finalCanRedo,
    getLastActivity: finalGetLastActivity,
    ...drawingOperations,
    ...imageOperations
  };
};
