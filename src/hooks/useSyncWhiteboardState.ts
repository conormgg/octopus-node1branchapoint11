
import { useState, useCallback } from 'react';
import { WhiteboardState, Tool, LineObject, ImageObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSelectionState } from './useSelectionState';
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
    historyIndex: 0,
    selectionState: {
      selectedIds: [],
      isTransforming: false,
      selectionRect: null
    }
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
  
  // Selection operations
  const {
    selectObject,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    startSelectionRect,
    updateSelectionRect,
    completeSelectionRect,
    setTransforming,
    applyTransformation
  } = useSelectionState(state, setState, addToHistory);

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
    } else if (state.currentTool === 'select') {
      // Start selection rectangle
      startSelectionRect(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, startSelectionRect, syncConfig.isReceiveOnly, panZoom]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    if (syncConfig.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    } else if (state.currentTool === 'select' && state.selectionState.selectionRect) {
      // Update selection rectangle
      updateSelectionRect(x, y);
    }
  }, [state.currentTool, state.selectionState.selectionRect, continueDrawing, continueErasing, updateSelectionRect, syncConfig.isReceiveOnly, panZoom]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (syncConfig.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    } else if (state.currentTool === 'select' && state.selectionState.selectionRect) {
      // Complete selection rectangle and select objects within it
      completeSelectionRect();
    }
  }, [state.currentTool, state.selectionState.selectionRect, stopDrawing, stopErasing, completeSelectionRect, syncConfig.isReceiveOnly]);

  return {
    state,
    syncState,
    setState,
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
    // Selection methods
    selectObject,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    setTransforming,
    applyTransformation,
    addToHistory,
    isReadOnly: syncConfig.isReceiveOnly
  };
};
