
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
    } else if (stableCurrentTool === 'select') {
      // Priority 1: Check if clicking inside an existing multi-object selection group
      if (stableSelectionState.selectedObjects.length > 1 && selection.isPointInSelectionBounds({ x, y })) {
        // Do nothing. By returning without stopping propagation, we allow the DOM event to reach Konva.
        // Konva will then correctly identify the click on the draggable SelectionGroup and initiate a drag.
        debugLog('PointerHandlers', 'Click is within group selection. Deferring to group drag handler.');
        return;
      }
      
      // Priority 2: Check if clicking a single, un-grouped, or new object
      const foundObjects = selection.findObjectsAtPoint({ x, y }, stableLines, stableImages);
      
      if (foundObjects.length > 0) {
        debugLog('PointerHandlers', 'Found objects at point', { count: foundObjects.length });
        // Use the new atomic selectObjects function
        selection.selectObjects([foundObjects[0]], stableLines, stableImages);
      } else {
        // Priority 3: If we clicked on truly empty space, clear selection and start a new one
        debugLog('PointerHandlers', 'Starting drag-to-select on empty space');
        selection.clearSelection();
        selection.setIsSelecting(true);
        selection.setSelectionBounds({ x, y, width: 0, height: 0 });
      }
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState.selectedObjects.length, panZoom, selection, drawingCoordination]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(x, y);
    } else if (stableCurrentTool === 'select' && stableSelectionState.isSelecting) {
      // Update drag-to-select rectangle
      const bounds = stableSelectionState.selectionBounds;
      if (bounds) {
        const newBounds = {
          x: Math.min(bounds.x, x),
          y: Math.min(bounds.y, y),
          width: Math.abs(x - bounds.x),
          height: Math.abs(y - bounds.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [stableCurrentTool, stableSelectionState.isSelecting, stableSelectionState.selectionBounds, panZoom, selection, drawingCoordination]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    } else if (stableCurrentTool === 'select' && stableSelectionState.isSelecting) {
      // Complete drag-to-select
      const bounds = stableSelectionState.selectionBounds;
      if (bounds && (bounds.width > 5 || bounds.height > 5)) {
        // Find objects within selection bounds
        const objectsInBounds = selection.findObjectsInBounds(bounds, stableLines, stableImages);
        // Use the new atomic selectObjects function
        selection.selectObjects(objectsInBounds, stableLines, stableImages);
      }
      
      // Cleanup the visual selection rectangle
      selection.setIsSelecting(false);
      selection.setSelectionBounds(null);
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState.isSelecting, stableSelectionState.selectionBounds, selection, drawingCoordination]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
