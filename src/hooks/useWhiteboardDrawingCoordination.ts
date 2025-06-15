
import { useCallback, useMemo } from 'react';
import { Tool } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useMonitoringIntegration } from './performance/useMonitoringIntegration';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('drawing');

/**
 * @hook useWhiteboardDrawingCoordination
 * @description Coordinates all drawing operations (pencil, highlighter, eraser) with performance monitoring
 */
export const useWhiteboardDrawingCoordination = (
  state: any,
  setState: any,
  addToHistory: () => void
) => {
  // Initialize performance monitoring
  const { wrapDrawingOperation } = useMonitoringIntegration();

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

  // Coordinate drawing start based on tool with performance monitoring
  const handleDrawingStart = useCallback((x: number, y: number) => {
    debugLog('DrawingCoordination', 'Drawing start requested', { x, y, tool: stableCurrentTool });
    
    const wrappedOperation = wrapDrawingOperation(
      (x: number, y: number) => {
        if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
          debugLog('DrawingCoordination', 'Starting drawing operation');
          startDrawing(x, y);
        } else if (stableCurrentTool === 'eraser') {
          debugLog('DrawingCoordination', 'Starting eraser operation');
          startErasing(x, y);
        }
      },
      `${stableCurrentTool}_start`
    );
    
    wrappedOperation(x, y);
  }, [stableCurrentTool, startDrawing, startErasing, wrapDrawingOperation]);

  // Coordinate drawing continuation based on tool with performance monitoring
  const handleDrawingContinue = useCallback((x: number, y: number) => {
    const wrappedOperation = wrapDrawingOperation(
      (x: number, y: number) => {
        if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
          debugLog('DrawingCoordination', 'Continuing drawing operation');
          continueDrawing(x, y);
        } else if (stableCurrentTool === 'eraser') {
          debugLog('DrawingCoordination', 'Continuing eraser operation');
          continueErasing(x, y);
        }
      },
      `${stableCurrentTool}_continue`
    );
    
    wrappedOperation(x, y);
  }, [stableCurrentTool, continueDrawing, continueErasing, wrapDrawingOperation]);

  // Coordinate drawing end based on tool with performance monitoring
  const handleDrawingEnd = useCallback(() => {
    const wrappedOperation = wrapDrawingOperation(
      () => {
        if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
          debugLog('DrawingCoordination', 'Finishing drawing operation');
          stopDrawing();
        } else if (stableCurrentTool === 'eraser') {
          debugLog('DrawingCoordination', 'Finishing eraser operation');
          stopErasing();
        }
      },
      `${stableCurrentTool}_end`
    );
    
    wrappedOperation();
  }, [stableCurrentTool, stopDrawing, stopErasing, wrapDrawingOperation]);

  return {
    handleDrawingStart,
    handleDrawingContinue,
    handleDrawingEnd
  };
};
