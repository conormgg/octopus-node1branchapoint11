
import { useState, useCallback, useRef } from 'react';
import { WhiteboardState, Tool, LineObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { UnifiedWhiteboardState } from '@/types/unifiedWhiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './sync/useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { serializeDrawOperation, serializeEraseOperation } from '@/utils/operationSerializer';

// Debounce utility for rapid operations
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

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

  const addToHistory = useCallback((lines: LineObject[]) => {
    baseAddToHistory(lines);
  }, [baseAddToHistory]);

  // Store lines before erasing for proper sync
  const linesBeforeErasingRef = useRef<LineObject[]>([]);

  // Drawing operations with sync
  const {
    startDrawing,
    continueDrawing,
    stopDrawing: baseStopDrawing
  } = useDrawingState(state, setState, addToHistory);

  // Debounced sync for drawing to avoid excessive network calls
  const debouncedSyncDraw = useDebounce((drawnLine: LineObject) => {
    if (sendOperation && !isApplyingRemoteOperation.current) {
      sendOperation(serializeDrawOperation(drawnLine));
    }
  }, 100);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopDrawing();

    // Sync the drawn line if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current && state.lines.length > 0) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        debouncedSyncDraw(drawnLine);
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation, debouncedSyncDraw]);

  // Eraser operations with improved sync logic
  const {
    startErasing: baseStartErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  const startErasing = useCallback((x: number, y: number) => {
    if (state.currentTool !== 'eraser') return;
    
    // Capture current lines before erasing starts
    linesBeforeErasingRef.current = [...state.lines];
    baseStartErasing(x, y);
  }, [state.currentTool, state.lines, baseStartErasing]);

  // Debounced sync for erasing to batch rapid erase operations
  const debouncedSyncErase = useDebounce((erasedLineIds: string[]) => {
    if (sendOperation && !isApplyingRemoteOperation.current && erasedLineIds.length > 0) {
      sendOperation(serializeEraseOperation(erasedLineIds));
    }
  }, 200);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Find the IDs of lines that were erased by comparing before and after
    const currentLineIds = new Set(state.lines.map(line => line.id));
    const erasedLineIds = linesBeforeErasingRef.current
      .filter(line => !currentLineIds.has(line.id))
      .map(line => line.id);
    
    // Sync the erased lines if we're not in receive-only mode
    if (erasedLineIds.length > 0) {
      debouncedSyncErase(erasedLineIds);
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, baseStopErasing, sendOperation, isApplyingRemoteOperation, debouncedSyncErase]);

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
