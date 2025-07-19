
import { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { useStageCoordinates } from './useStageCoordinates';
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
  const { getRelativePointerPosition } = useStageCoordinates(state.panZoomState);

  // Handle pointer down
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    debugLog('PointerHandlers', 'Pointer down', { x, y, tool: stableCurrentTool });
    
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) {
      debugLog('PointerHandlers', 'Ignoring pointer down - gesture active');
      return;
    }
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingStart(x, y);
    } else if (stableCurrentTool === 'select') {
      // Handle selection logic with priority:
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
      
      if (isInSelectionBounds && stableSelectionState.selectedObjects.length > 0) {
        debugLog('PointerHandlers', 'Clicked within selection bounds');
        // Clicking within selection bounds - this will allow dragging the entire group
        // The actual dragging logic will be handled by the SelectionGroup component
        // We don't need to change the selection here, just maintain it
        return;
      }
      
      // Check for individual objects
      const foundObjects = selection.findObjectsAtPoint({ x, y }, stableLines, stableImages);
      
      if (foundObjects.length > 0) {
        debugLog('PointerHandlers', 'Found objects at point', { count: foundObjects.length });
        // Select the first found object
        selection.selectObjects([foundObjects[0]]);
        // Update selection bounds for the selected object
        setTimeout(() => {
          selection.updateSelectionBounds([foundObjects[0]], stableLines, stableImages);
        }, 0);
      } else {
        debugLog('PointerHandlers', 'Starting drag-to-select');
        // Clear selection when clicking on empty space
        selection.clearSelection();
        // Start drag-to-select
        selection.setIsSelecting(true);
        selection.setSelectionBounds({ x, y, width: 0, height: 0 });
      }
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState.selectedObjects.length, panZoom, selection, drawingCoordination, getRelativePointerPosition]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
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
  }, [stableCurrentTool, stableSelectionState.isSelecting, stableSelectionState.selectionBounds, panZoom, selection, drawingCoordination, getRelativePointerPosition]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter' || stableCurrentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    } else if (stableCurrentTool === 'select' && stableSelectionState.isSelecting) {
      // Complete drag-to-select
      const bounds = stableSelectionState.selectionBounds;
      if (bounds && (bounds.width > 5 || bounds.height > 5)) {
        // Find objects within selection bounds
        const objectsInBounds = selection.findObjectsInBounds(bounds, stableLines, stableImages);
        selection.selectObjects(objectsInBounds);
        // Update selection bounds for the selected objects
        setTimeout(() => {
          selection.updateSelectionBounds(objectsInBounds, stableLines, stableImages);
        }, 0);
      }
      
      // End selection
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
