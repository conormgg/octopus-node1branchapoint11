
import { useCallback } from 'react';
import { Tool } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Debug logging for drawing coordination
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[DrawingCoordination:${context}] ${action}`, data || '');
  }
};

/**
 * @hook useWhiteboardDrawingCoordination
 * @description Coordinates all drawing operations (pencil, highlighter, eraser)
 */
export const useWhiteboardDrawingCoordination = (
  state: any,
  setState: any,
  addToHistory: () => void
) => {
  // Drawing operations (pencil and highlighter)
  const {
    startDrawing,
    continueDrawing,
    stopDrawing
  } = useDrawingState(state, setState, addToHistory);

  // Eraser operations
  const {
    startErasing,
    continueErasing,
    stopErasing
  } = useEraserState(state, setState, addToHistory);

  // Coordinate drawing start based on tool
  const handleDrawingStart = useCallback((x: number, y: number) => {
    debugLog('Start', 'Drawing start requested', { x, y, tool: state.currentTool });
    
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter') {
      debugLog('Drawing', 'Starting drawing operation');
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      debugLog('Eraser', 'Starting eraser operation');
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing]);

  // Coordinate drawing continuation based on tool
  const handleDrawingContinue = useCallback((x: number, y: number) => {
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter') {
      debugLog('Drawing', 'Continuing drawing operation');
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      debugLog('Eraser', 'Continuing eraser operation');
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing]);

  // Coordinate drawing end based on tool
  const handleDrawingEnd = useCallback(() => {
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter') {
      debugLog('Drawing', 'Finishing drawing operation');
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      debugLog('Eraser', 'Finishing eraser operation');
      stopErasing();
    }
  }, [state.currentTool, stopDrawing, stopErasing]);

  return {
    handleDrawingStart,
    handleDrawingContinue,
    handleDrawingEnd
  };
};
