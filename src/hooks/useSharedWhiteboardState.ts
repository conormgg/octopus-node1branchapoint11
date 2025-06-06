
import { useState, useCallback, useEffect, useRef } from 'react';
import { WhiteboardState, Tool, LineObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { serializeDrawOperation, serializeEraseOperation } from '@/utils/operationSerializer';

export const useSharedWhiteboardState = (syncConfig?: SyncConfig, whiteboardId?: string) => {
  const { getWhiteboardState, updateWhiteboardState } = useWhiteboardStateContext();
  
  // Track lines before erasing to detect what was erased
  const linesBeforeErasingRef = useRef<LineObject[]>([]);
  
  // Initialize state with shared state if available
  const [state, setState] = useState<WhiteboardState>(() => {
    const sharedLines = whiteboardId ? getWhiteboardState(whiteboardId) : [];
    return {
      lines: sharedLines,
      currentTool: 'pencil',
      currentColor: '#000000',
      currentStrokeWidth: 5,
      isDrawing: false,
      panZoomState: { x: 0, y: 0, scale: 1 },
      history: [sharedLines],
      historyIndex: 0
    };
  });

  // Update shared state whenever lines change
  useEffect(() => {
    if (whiteboardId) {
      updateWhiteboardState(whiteboardId, state.lines);
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

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
    startErasing: baseStartErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  const startErasing = useCallback((x: number, y: number) => {
    if (!state.isDrawing) {
      // Store the current lines before erasing starts
      linesBeforeErasingRef.current = [...state.lines];
    }
    baseStartErasing(x, y);
  }, [state.lines, state.isDrawing, baseStartErasing]);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Sync the erased lines if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Find the IDs of lines that were erased by comparing with the lines before erasing
      const erasedLineIds = linesBeforeErasingRef.current
        .filter(line => !state.lines.some(l => l.id === line.id))
        .map(line => line.id);
      
      console.log('Lines before erasing:', linesBeforeErasingRef.current.length);
      console.log('Lines after erasing:', state.lines.length);
      console.log('Erased line IDs:', erasedLineIds);
      
      if (erasedLineIds.length > 0) {
        sendOperation(serializeEraseOperation(erasedLineIds));
      }
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
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
