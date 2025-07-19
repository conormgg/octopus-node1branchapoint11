
import { useCallback, useMemo } from 'react';
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
  console.log('[DrawingCoordination] Initializing with state:', {
    hasState: !!state,
    hasSetState: !!setState,
    hasAddToHistory: !!addToHistory,
    currentTool: state?.currentTool,
    linesCount: state?.lines?.length || 0
  });

  // Memoize current tool to prevent unnecessary re-initializations
  const stableCurrentTool = useMemo(() => state?.currentTool || 'pencil', [state?.currentTool]);

  // Initialize drawing and eraser states
  const drawingState = useDrawingState(state, setState, addToHistory);
  const eraserState = useEraserState(state, setState, addToHistory);

  // Memoize the operations to prevent unnecessary re-renders
  const drawingOperations = useMemo(() => {
    if (!state || !setState || !addToHistory) {
      console.log('[DrawingCoordination] WARNING: Missing required parameters for drawing operations');
      return { startDrawing: () => {}, continueDrawing: () => {}, stopDrawing: () => {} };
    }
    return drawingState;
  }, [drawingState, state, setState, addToHistory]);

  const eraserOperations = useMemo(() => {
    if (!state || !setState || !addToHistory) {
      console.log('[DrawingCoordination] WARNING: Missing required parameters for eraser operations');
      return { startErasing: () => {}, continueErasing: () => {}, stopErasing: () => {} };
    }
    return eraserState;
  }, [eraserState, state, setState, addToHistory]);

  // Destructure with stable references
  const { startDrawing, continueDrawing, stopDrawing } = drawingOperations;
  const { startErasing, continueErasing, stopErasing } = eraserOperations;

  // Coordinate drawing start based on tool
  const handleDrawingStart = useCallback((x: number, y: number) => {
    console.log('[DrawingCoordination] DRAWING START requested:', { x, y, tool: stableCurrentTool });
    
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

  // Coordinate drawing continuation based on tool
  const handleDrawingContinue = useCallback((x: number, y: number) => {
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      console.log('[DrawingCoordination] Continuing drawing operation:', { x, y });
      continueDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      console.log('[DrawingCoordination] Continuing eraser operation:', { x, y });
      continueErasing(x, y);
    }
  }, [stableCurrentTool, continueDrawing, continueErasing]);

  // Coordinate drawing end based on tool
  const handleDrawingEnd = useCallback(() => {
    console.log('[DrawingCoordination] DRAWING END requested for tool:', stableCurrentTool);
    
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

  console.log('[DrawingCoordination] Coordination methods created:', {
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
