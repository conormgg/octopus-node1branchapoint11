
import { useCallback } from 'react';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Debug logging for pointer events
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[PointerHandlers:${context}] ${action}`, data || '');
  }
};

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
  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    debugLog('Pointer', 'Pointer down', { x, y, tool: state.currentTool });
    
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) {
      debugLog('Pointer', 'Ignoring pointer down - gesture active');
      return;
    }
    
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter' || state.currentTool === 'eraser') {
      drawingCoordination.handleDrawingStart(x, y);
    } else if (state.currentTool === 'select') {
      // Handle selection logic with priority:
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
      
      if (isInSelectionBounds && selection.selectionState.selectedObjects.length > 0) {
        debugLog('Selection', 'Clicked within selection bounds');
        // Clicking within selection bounds - this will allow dragging the entire group
        // The actual dragging logic will be handled by the SelectionGroup component
        // We don't need to change the selection here, just maintain it
        return;
      }
      
      // Check for individual objects
      const foundObjects = selection.findObjectsAtPoint({ x, y }, state.lines, state.images);
      
      if (foundObjects.length > 0) {
        debugLog('Selection', 'Found objects at point', { count: foundObjects.length });
        // Select the first found object
        selection.selectObjects([foundObjects[0]]);
        // Update selection bounds for the selected object
        setTimeout(() => {
          selection.updateSelectionBounds([foundObjects[0]], state.lines, state.images);
        }, 0);
      } else {
        debugLog('Selection', 'Starting drag-to-select');
        // Clear selection when clicking on empty space
        selection.clearSelection();
        // Start drag-to-select
        selection.setIsSelecting(true);
        selection.setSelectionBounds({ x, y, width: 0, height: 0 });
      }
    }
  }, [state.currentTool, state.lines, state.images, panZoom, selection, drawingCoordination]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter' || state.currentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(x, y);
    } else if (state.currentTool === 'select' && selection.selectionState.isSelecting) {
      // Update drag-to-select rectangle
      const bounds = selection.selectionState.selectionBounds;
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
  }, [state.currentTool, panZoom, selection, drawingCoordination]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter' || state.currentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    } else if (state.currentTool === 'select' && selection.selectionState.isSelecting) {
      // Complete drag-to-select
      const bounds = selection.selectionState.selectionBounds;
      if (bounds && (bounds.width > 5 || bounds.height > 5)) {
        // Find objects within selection bounds
        const objectsInBounds = selection.findObjectsInBounds(bounds, state.lines, state.images);
        selection.selectObjects(objectsInBounds);
        // Update selection bounds for the selected objects
        setTimeout(() => {
          selection.updateSelectionBounds(objectsInBounds, state.lines, state.images);
        }, 0);
      }
      
      // End selection
      selection.setIsSelecting(false);
      selection.setSelectionBounds(null);
    }
  }, [state.currentTool, state.lines, state.images, selection, drawingCoordination]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
