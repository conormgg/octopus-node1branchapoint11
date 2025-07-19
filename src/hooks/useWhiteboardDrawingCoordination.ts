
import { useCallback, useMemo, useRef } from 'react';
import { Tool } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('drawing');

export const useWhiteboardDrawingCoordination = (
  state: any,
  setState: any,
  addToHistory: () => void
) => {
  console.log('[DrawingCoordination] STABLE - Initializing with state:', {
    hasState: !!state,
    hasSetState: !!setState,
    hasAddToHistory: !!addToHistory,
    currentTool: state?.currentTool,
    linesCount: state?.lines?.length || 0
  });

  // Use refs to prevent re-initialization
  const stateRef = useRef(state);
  const setStateRef = useRef(setState);
  const addToHistoryRef = useRef(addToHistory);
  
  // Update refs when values change
  stateRef.current = state;
  setStateRef.current = setState;
  addToHistoryRef.current = addToHistory;

  // Memoize current tool to prevent unnecessary re-initializations
  const stableCurrentTool = useMemo(() => state?.currentTool || 'pencil', [state?.currentTool]);

  // CRITICAL: Use stable refs for drawing and eraser states to prevent re-initialization
  const drawingState = useMemo(() => {
    if (!stateRef.current || !setStateRef.current || !addToHistoryRef.current) {
      console.log('[DrawingCoordination] WARNING: Missing required parameters for drawing operations');
      return { startDrawing: () => {}, continueDrawing: () => {}, stopDrawing: () => {} };
    }
    return useDrawingState(stateRef.current, setStateRef.current, addToHistoryRef.current);
  }, [stateRef.current, setStateRef.current, addToHistoryRef.current]);

  const eraserState = useMemo(() => {
    if (!stateRef.current || !setStateRef.current || !addToHistoryRef.current) {
      console.log('[DrawingCoordination] WARNING: Missing required parameters for eraser operations');
      return { startErasing: () => {}, continueErasing: () => {}, stopErasing: () => {} };
    }
    return useEraserState(stateRef.current, setStateRef.current, addToHistoryRef.current);
  }, [stateRef.current, setStateRef.current, addToHistoryRef.current]);

  // Destructure with stable references
  const { startDrawing, continueDrawing, stopDrawing } = drawingState;
  const { startErasing, continueErasing, stopErasing } = eraserState;

  // STABLE coordinate drawing start based on tool
  const handleDrawingStart = useCallback((x: number, y: number) => {
    console.log('[DrawingCoordination] STABLE DRAWING START requested:', { x, y, tool: stableCurrentTool });
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      console.log('[DrawingCoordination] Starting drawing operation');
      startDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      console.log('[DrawingCoordination] Starting eraser operation');
      startErasing(x, y);
    } else {
      console.log('[DrawingCoordination] WARNING: Unknown tool for drawing start:', stableCurrentTool);
    }
  }, [stableCurrentTool, startDrawing, startErasing]);

  // STABLE coordinate drawing continuation based on tool
  const handleDrawingContinue = useCallback((x: number, y: number) => {
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      console.log('[DrawingCoordination] Continuing drawing operation:', { x, y });
      continueDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      console.log('[DrawingCoordination] Continuing eraser operation:', { x, y });
      continueErasing(x, y);
    }
  }, [stableCurrentTool, continueDrawing, continueErasing]);

  // STABLE coordinate drawing end based on tool
  const handleDrawingEnd = useCallback(() => {
    console.log('[DrawingCoordination] STABLE DRAWING END requested for tool:', stableCurrentTool);
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      console.log('[DrawingCoordination] Finishing drawing operation');
      stopDrawing();
    } else if (stableCurrentTool === 'eraser') {
      console.log('[DrawingCoordination] Finishing eraser operation');
      stopErasing();
    } else {
      console.log('[DrawingCoordination] WARNING: Unknown tool for drawing end:', stableCurrentTool);
    }
  }, [stableCurrentTool, stopDrawing, stopErasing]);

  console.log('[DrawingCoordination] STABLE coordination methods created:', {
    hasHandleDrawingStart: !!handleDrawingStart,
    hasHandleDrawingContinue: !!handleDrawingContinue,
    hasHandleDrawingEnd: !!handleDrawingEnd
  });

  return {
    handleDrawingStart,
    handleDrawingContinue,
    handleDrawingEnd
  };
};
