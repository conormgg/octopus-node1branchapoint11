
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
  selection: any,
  drawingCoordination: any
) => {
  // Memoize stable references to prevent unnecessary re-renders
  const stableSelectionState = useMemo(() => selection.selectionState, [selection.selectionState]);
  const stableCurrentTool = useMemo(() => state.currentTool, [state.currentTool]);
  const stableLines = useMemo(() => state.lines, [state.lines]);
  const stableImages = useMemo(() => state.images, [state.images]);

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
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState.selectedObjects.length, panZoom, selection, drawingCoordination]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(x, y);
    }
  }, [stableCurrentTool, stableSelectionState.isSelecting, stableSelectionState.selectionBounds, panZoom, selection, drawingCoordination]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState.isSelecting, stableSelectionState.selectionBounds, selection, drawingCoordination]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
