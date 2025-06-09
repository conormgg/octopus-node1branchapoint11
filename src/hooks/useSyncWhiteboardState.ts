
import { useState, useCallback } from 'react';
import { WhiteboardState, Tool, LineObject, ImageObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { usePanZoom } from './usePanZoom';
import { serializeDrawOperation, serializeEraseOperation } from '@/utils/operationSerializer';

export const useSyncWhiteboardState = (syncConfig: SyncConfig) => {
  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    history: [{ lines: [], images: [] }],
    historyIndex: 0
  });

  // Pan/zoom operations
  const setPanZoomState = useCallback((panZoomState: any) => {
    setState(prev => ({
      ...prev,
      panZoomState
    }));
  }, []);

  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Handle remote operations
  const { handleRemoteOperation, isApplyingRemoteOperation } = useRemoteOperationHandler(setState);

  // Set up sync
  const { syncState, sendOperation } = useSyncState(syncConfig, handleRemoteOperation);

  // History management
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
    if (sendOperation && !isApplyingRemoteOperation.current && !syncConfig.isReceiveOnly) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        sendOperation(serializeDrawOperation(drawnLine));
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation, syncConfig.isReceiveOnly]);

  // Eraser operations with sync  
  const {
    startErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Add sync logic for erasing if needed
  }, [state.isDrawing, baseStopErasing]);

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
    if (syncConfig.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, syncConfig.isReceiveOnly, panZoom]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    if (syncConfig.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig.isReceiveOnly, panZoom]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (syncConfig.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    }
  }, [state.currentTool, stopDrawing, stopErasing, syncConfig.isReceiveOnly]);

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
    panZoom,
    isReadOnly: syncConfig.isReceiveOnly
  };
};
