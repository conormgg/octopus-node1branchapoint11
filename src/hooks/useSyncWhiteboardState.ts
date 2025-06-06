
import { useState, useCallback } from 'react';
import { WhiteboardState, Tool } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { UnifiedWhiteboardState } from '@/types/unifiedWhiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './sync/useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { useSyncDrawingOperations } from './whiteboard/useSyncDrawingOperations';
import { useSyncEraserOperations } from './whiteboard/useSyncEraserOperations';
import { usePointerHandlers } from './whiteboard/usePointerHandlers';

export const useSyncWhiteboardState = (syncConfig?: SyncConfig): UnifiedWhiteboardState => {
  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    history: [[]],
    historyIndex: 0
  });

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

  const addToHistory = useCallback((lines: any[]) => {
    baseAddToHistory(lines);
  }, [baseAddToHistory]);

  // Drawing operations with sync
  const {
    startDrawing,
    continueDrawing,
    stopDrawing: baseStopDrawing
  } = useDrawingState(state, setState, addToHistory);

  // Sync drawing operations
  const { stopDrawing } = useSyncDrawingOperations(
    state,
    baseStopDrawing,
    sendOperation,
    isApplyingRemoteOperation
  );

  // Eraser operations with improved sync logic
  const {
    startErasing: baseStartErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  // Sync eraser operations
  const { startErasing, stopErasing } = useSyncEraserOperations(
    state,
    baseStartErasing,
    baseStopErasing,
    sendOperation,
    isApplyingRemoteOperation
  );

  // Pointer handlers
  const { handlePointerDown, handlePointerMove, handlePointerUp } = usePointerHandlers(
    state,
    startDrawing,
    startErasing,
    continueDrawing,
    continueErasing,
    stopDrawing,
    stopErasing,
    syncConfig
  );

  // Tool change
  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({
      ...prev,
      currentTool: tool
    }));
  }, []);

  // Color change
  const setColor = useCallback((color: string) => {
    setState(prev => ({
      ...prev,
      currentColor: color
    }));
  }, []);

  // Stroke width change
  const setStrokeWidth = useCallback((width: number) => {
    setState(prev => ({
      ...prev,
      currentStrokeWidth: width
    }));
  }, []);

  return {
    state,
    syncState,
    setTool,
    setColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    canUndo,
    canRedo,
    isReadOnly: syncConfig?.isReceiveOnly || false
  };
};
