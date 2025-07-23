
import { useCallback, useMemo } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

/**
 * @hook useWhiteboardPointerHandlers
 * @description Handles all pointer events and coordinates with appropriate tools
 */
export const useWhiteboardPointerHandlers = (
  state: any,
  panZoom: any,
  selection: any, // Keep for backward compatibility but not used for 'select' tool
  drawingCoordination: any
) => {
  // Simplified memoization for drawing tools only
  const stableCurrentTool = useMemo(() => state.currentTool, [state.currentTool]);

  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    debugLog('PointerHandlers', 'Pointer down', { x, y, tool: stableCurrentTool });
    
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) {
      debugLog('PointerHandlers', 'Ignoring pointer down - gesture active');
      return;
    }
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingStart(x, y);
    }
    // Note: 'select' tool now handled by select2 system in stage event handlers
  }, [stableCurrentTool, panZoom, drawingCoordination]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(x, y);
    }
    // Note: 'select' tool now handled by select2 system in stage event handlers
  }, [stableCurrentTool, panZoom, drawingCoordination]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    }
    // Note: 'select' tool now handled by select2 system in stage event handlers
  }, [stableCurrentTool, drawingCoordination]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
