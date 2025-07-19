
import { useCallback, useMemo } from 'react';
import { Tool } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('drawing');

/**
 * @hook useWhiteboardDrawingCoordination
 * @description Coordinates all drawing operations (pencil, highlighter, eraser)
 */
export const useWhiteboardDrawingCoordination = (
  state: any,
  setState: any,
  addToHistory: () => void
) => {
  console.log('[DrawingCoordination] Hook initialized', { 
    hasState: !!state, 
    hasSetState: !!setState, 
    hasAddToHistory: !!addToHistory,
    currentTool: state?.currentTool 
  });

  // Memoize current tool to prevent unnecessary re-initializations
  const stableCurrentTool = useMemo(() => state?.currentTool || 'pencil', [state?.currentTool]);

  // Call hooks at the top level - this is required by Rules of Hooks
  const drawingState = useDrawingState(state, setState, addToHistory);
  const eraserState = useEraserState(state, setState, addToHistory);

  console.log('[DrawingCoordination] States initialized', { 
    hasDrawingState: !!drawingState.startDrawing,
    hasEraserState: !!eraserState.startErasing 
  });

  // Memoize the operations to prevent unnecessary re-renders
  const drawingOperations = useMemo(() => {
    if (!state || !setState || !addToHistory) {
      console.warn('[DrawingCoordination] Missing required parameters for drawing operations');
      return { startDrawing: () => {}, continueDrawing: () => {}, stopDrawing: () => {} };
    }
    return drawingState;
  }, [drawingState, state, setState, addToHistory]);

  const eraserOperations = useMemo(() => {
    if (!state || !setState || !addToHistory) {
      console.warn('[DrawingCoordination] Missing required parameters for eraser operations'); 
      return { startErasing: () => {}, continueErasing: () => {}, stopErasing: () => {} };
    }
    return eraserState;
  }, [eraserState, state, setState, addToHistory]);

  // Destructure with stable references
  const { startDrawing, continueDrawing, stopDrawing } = drawingOperations;
  const { startErasing, continueErasing, stopErasing } = eraserOperations;

  // Coordinate drawing start based on tool
  const handleDrawingStart = useCallback((x: number, y: number) => {
    console.log('[DrawingCoordination] Drawing start requested', { x, y, tool: stableCurrentTool });
    debugLog('DrawingCoordination', 'Drawing start requested', { x, y, tool: stableCurrentTool });
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      console.log('[DrawingCoordination] Starting drawing operation');
      debugLog('DrawingCoordination', 'Starting drawing operation');
      startDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      console.log('[DrawingCoordination] Starting eraser operation');
      debugLog('DrawingCoordination', 'Starting eraser operation');
      startErasing(x, y);
    } else {
      console.warn('[DrawingCoordination] Unknown tool for drawing start:', stableCurrentTool);
    }
  }, [stableCurrentTool, startDrawing, startErasing]);

  // Coordinate drawing continuation based on tool
  const handleDrawingContinue = useCallback((x: number, y: number) => {
    console.log('[DrawingCoordination] Drawing continue requested', { x, y, tool: stableCurrentTool });
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      debugLog('DrawingCoordination', 'Continuing drawing operation');
      continueDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      debugLog('DrawingCoordination', 'Continuing eraser operation');
      continueErasing(x, y);
    }
  }, [stableCurrentTool, continueDrawing, continueErasing]);

  // Coordinate drawing end based on tool
  const handleDrawingEnd = useCallback(() => {
    console.log('[DrawingCoordination] Drawing end requested', { tool: stableCurrentTool });
    debugLog('DrawingCoordination', 'Drawing end requested', { tool: stableCurrentTool });
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      console.log('[DrawingCoordination] Finishing drawing operation');
      debugLog('DrawingCoordination', 'Finishing drawing operation');
      stopDrawing();
    } else if (stableCurrentTool === 'eraser') {
      console.log('[DrawingCoordination] Finishing eraser operation');
      debugLog('DrawingCoordination', 'Finishing eraser operation');
      stopErasing();
    }
  }, [stableCurrentTool, stopDrawing, stopErasing]);

  console.log('[DrawingCoordination] Returning handlers', {
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
