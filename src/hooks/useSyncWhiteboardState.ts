import { useState, useCallback } from 'react';
import { WhiteboardState, Tool, LineObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { serializeDrawOperation, serializeEraseOperation } from '@/utils/operationSerializer';

export const useSyncWhiteboardState = (syncConfig?: SyncConfig) => {
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

  const addToHistory = useCallback((lines: LineObject[]) => {
    baseAddToHistory(lines);
  }, [baseAddToHistory]);

  // Drawing operations with sync
  const {
    startDrawing,
    continueDrawing,
    stopDrawing: baseStopDrawing
  } = useDrawingState(state, setState, addToHistory);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopDrawing();

    // Sync the drawn line if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        sendOperation(serializeDrawOperation(drawnLine));
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation]);

  // Eraser operations with sync
  const {
    startErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    // Get the current lines before stopping erasing
    const linesBefore = [...state.lines];
    
    baseStopErasing();
    
    // Sync the erased lines if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Find the IDs of lines that were erased
      const erasedLineIds = linesBefore
        .filter(line => !state.lines.some(l => l.id === line.id))
        .map(line => line.id);
      
      if (erasedLineIds.length > 0) {
        sendOperation(serializeEraseOperation(erasedLineIds));
      }
    }
  }, [state.isDrawing, state.lines, baseStopErasing, sendOperation, isApplyingRemoteOperation]);

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

  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, syncConfig?.isReceiveOnly]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig?.isReceiveOnly]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    }
  }, [state.currentTool, stopDrawing, stopErasing, syncConfig?.isReceiveOnly]);

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
