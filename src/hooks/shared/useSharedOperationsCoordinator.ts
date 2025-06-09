
import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState } from '@/types/whiteboard';
import { useHistoryState } from '../useHistoryState';
import { useSyncState } from '../useSyncState';
import { useRemoteOperationHandler } from '../useRemoteOperationHandler';
import { useSharedDrawingOperations } from './useSharedDrawingOperations';
import { useSharedImageOperations } from './useSharedImageOperations';

export const useSharedOperationsCoordinator = (
  syncConfig: SyncConfig | undefined,
  state: WhiteboardState,
  setState: (updater: (prev: WhiteboardState) => WhiteboardState) => void,
  whiteboardId?: string
) => {
  // Handle remote operations
  const { handleRemoteOperation, isApplyingRemoteOperation } = useRemoteOperationHandler(setState);

  // Set up sync if config is provided
  const { syncState, sendOperation } = syncConfig 
    ? useSyncState(syncConfig, handleRemoteOperation)
    : { syncState: null, sendOperation: null };

  // Enhanced add to history that syncs operations
  const {
    addToHistory: baseAddToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistoryState(state, setState);

  const addToHistory = useCallback(() => {
    baseAddToHistory({ lines: state.lines, images: state.images });
  }, [baseAddToHistory, state.lines, state.images]);

  // Drawing and erasing operations with whiteboard ID
  // Use the full whiteboard ID from sync config or fallback to provided ID
  const actualWhiteboardId = syncConfig?.whiteboardId || whiteboardId;
  console.log(`[Operations Coordinator] Using whiteboard ID: ${actualWhiteboardId}`);
  
  const drawingOperations = useSharedDrawingOperations(
    state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, actualWhiteboardId
  );

  // Image operations with proper parameter handling
  const imageOperations = useSharedImageOperations(
    state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, actualWhiteboardId
  );

  return {
    syncState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    ...drawingOperations,
    ...imageOperations
  };
};
