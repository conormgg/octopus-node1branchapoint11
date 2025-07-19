
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
  // Memoize current tool to prevent unnecessary re-initializations
  const stableCurrentTool = useMemo(() => state?.currentTool || 'pencil', [state?.currentTool]);

  // Call hooks at the top level - this is required by Rules of Hooks
  const drawingState = useDrawingState(state, setState, addToHistory);
  const eraserState = useEraserState(state, setState, addToHistory);

  // Memoize the operations to prevent unnecessary re-renders
  const drawingOperations = useMemo(() => {
    if (!state || !setState || !addToHistory) {
      return { startDrawing: () => {}, continueDrawing: () => {}, stopDrawing: () => {} };
    }
    return drawingState;
  }, [drawingState, state, setState, addToHistory]);

  const eraserOperations = useMemo(() => {
    if (!state || !setState || !addToHistory) {
      return { startErasing: () => {}, continueErasing: () => {}, stopErasing: () => {} };
    }
    return eraserState;
  }, [eraserState, state, setState, addToHistory]);

  // Destructure with stable references
  const { startDrawing, continueDrawing, stopDrawing } = drawingOperations;
  const { startErasing, continueErasing, stopErasing } = eraserOperations;

  // Coordinate drawing start based on tool
  const handleDrawingStart = useCallback((x: number, y: number) => {
    debugLog('DrawingCoordination', 'Drawing start requested', { x, y, tool: stableCurrentTool });
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      debugLog('DrawingCoordination', 'Starting drawing operation');
      startDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      debugLog('DrawingCoordination', 'Starting eraser operation');
      startErasing(x, y);
    }
  }, [stableCurrentTool, startDrawing, startErasing]);

  // Coordinate drawing continuation based on tool
  const handleDrawingContinue = useCallback((x: number, y: number) => {
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
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      debugLog('DrawingCoordination', 'Finishing drawing operation');
      stopDrawing();
    } else if (stableCurrentTool === 'eraser') {
      debugLog('DrawingCoordination', 'Finishing eraser operation');
      stopErasing();
    }
  }, [stableCurrentTool, stopDrawing, stopErasing]);

  return {
    handleDrawingStart,
    handleDrawingContinue,
    handleDrawingEnd
  };
};
