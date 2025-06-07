
import { useState, useCallback, useEffect, useRef } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { usePanZoom } from './usePanZoom';
import { useSharedDrawingOperations } from './shared/useSharedDrawingOperations';
import { useSharedImageOperations } from './shared/useSharedImageOperations';
import { useSharedPointerHandlers } from './shared/useSharedPointerHandlers';
import { useSharedStateManagement } from './shared/useSharedStateManagement';

export const useSharedWhiteboardState = (syncConfig?: SyncConfig, whiteboardId?: string) => {
  const { getWhiteboardState, updateWhiteboardState } = useWhiteboardStateContext();
  const initializedRef = useRef(false);
  
  // Initialize state with shared state if available
  const [state, setState] = useState<WhiteboardState>(() => {
    const sharedLines = whiteboardId ? getWhiteboardState(whiteboardId) : [];
    return {
      lines: sharedLines,
      images: [],
      currentTool: 'pencil',
      currentColor: '#000000',
      currentStrokeWidth: 5,
      isDrawing: false,
      panZoomState: { x: 0, y: 0, scale: 1 },
      history: [{ lines: sharedLines, images: [] }],
      historyIndex: 0
    };
  });

  // State management functions
  const { setPanZoomState, setTool, setColor, setStrokeWidth } = useSharedStateManagement(setState);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Update shared state whenever lines change (but only after initial setup)
  useEffect(() => {
    if (whiteboardId && initializedRef.current) {
      updateWhiteboardState(whiteboardId, state.lines);
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

  // Mark as initialized after first render
  useEffect(() => {
    initializedRef.current = true;
  }, []);

  // Handle remote operations - use stable callback to prevent sync re-subscriptions
  const { handleRemoteOperation, isApplyingRemoteOperation } = useRemoteOperationHandler(setState);
  
  // Stable callback for remote operations to prevent useSyncState re-subscriptions
  const stableHandleRemoteOperation = useCallback((operation: any) => {
    handleRemoteOperation(operation);
  }, [handleRemoteOperation]);

  // Set up sync if config is provided - use stable config and handler
  const { syncState, sendOperation } = syncConfig 
    ? useSyncState(syncConfig, stableHandleRemoteOperation)
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

  // Drawing and erasing operations
  const {
    startDrawing,
    continueDrawing,
    stopDrawing,
    startErasing,
    continueErasing,
    stopErasing
  } = useSharedDrawingOperations(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation);

  // Image operations
  const { updateImageState, handlePaste } = useSharedImageOperations(
    state, setState, addToHistory, sendOperation, isApplyingRemoteOperation
  );

  // Pointer event handlers
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useSharedPointerHandlers(
    state, startDrawing, continueDrawing, stopDrawing, startErasing, continueErasing, stopErasing,
    syncConfig, panZoom
  );

  return {
    state,
    syncState,
    setTool,
    setColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePaste,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    panZoom,
    updateImageState,
    isReadOnly: syncConfig?.isReceiveOnly || false
  };
};
