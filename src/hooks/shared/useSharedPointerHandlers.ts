
import { useCallback } from 'react';
import { Tool } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';

export const useSharedPointerHandlers = (
  state: { currentTool: Tool; lines: any[]; images: any[] },
  startDrawing: (x: number, y: number) => void,
  continueDrawing: (x: number, y: number) => void,
  stopDrawing: () => void,
  startErasing: (x: number, y: number) => void,
  continueErasing: (x: number, y: number) => void,
  stopErasing: () => void,
  syncConfig: SyncConfig | undefined,
  panZoom: any,
  selection?: any
) => {
  // Handle pointer down - for drawing and selection operations
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (syncConfig?.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    } else if (state.currentTool === 'select' && selection) {
      // Handle selection logic with priority and safety checks:
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      if (selection.isPointInSelectionBounds && selection.findObjectsAtPoint && selection.selectObjects && selection.setIsSelecting && selection.setSelectionBounds && selection.clearSelection) {
        const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
        
        if (isInSelectionBounds && selection.selectionState?.selectedObjects?.length > 0) {
          // Clicking within selection bounds - this will allow dragging the entire group
          // The actual dragging logic will be handled by the SelectionGroup component
          // We don't need to change the selection here, just maintain it
          return;
        }
        
        // Check for individual objects
        const foundObjects = selection.findObjectsAtPoint({ x, y }, state.lines, state.images);
        
        if (foundObjects.length > 0) {
          // Select the first found object
          selection.selectObjects([foundObjects[0]]);
        } else {
          // Clear selection when clicking on empty space
          selection.clearSelection();
          // Start drag-to-select
          selection.setIsSelecting(true);
          selection.setSelectionBounds({ x, y, width: 0, height: 0 });
        }
      }
    }
  }, [state.currentTool, state.lines, state.images, startDrawing, startErasing, syncConfig?.isReceiveOnly, panZoom, selection]);

  // Handle pointer move - for drawing and selection operations
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (syncConfig?.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    } else if (state.currentTool === 'select' && selection && selection.selectionState?.isSelecting) {
      // Update drag-to-select rectangle with safety checks
      if (selection.setSelectionBounds && selection.selectionState.selectionBounds) {
        const bounds = selection.selectionState.selectionBounds;
        const newBounds = {
          x: Math.min(bounds.x, x),
          y: Math.min(bounds.y, y),
          width: Math.abs(x - bounds.x),
          height: Math.abs(y - bounds.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig?.isReceiveOnly, panZoom, selection]);

  // Handle pointer up - for drawing and selection operations
  const handlePointerUp = useCallback(() => {
    // Don't allow operations in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    } else if (state.currentTool === 'select' && selection && selection.selectionState?.isSelecting) {
      // Complete drag-to-select with safety checks
      if (selection.setIsSelecting && selection.setSelectionBounds && selection.findObjectsInBounds && selection.selectObjects) {
        const bounds = selection.selectionState.selectionBounds;
        if (bounds && (bounds.width > 5 || bounds.height > 5)) {
          // Find objects within selection bounds
          const objectsInBounds = selection.findObjectsInBounds(bounds, state.lines, state.images);
          selection.selectObjects(objectsInBounds);
        }
        
        // End selection
        selection.setIsSelecting(false);
        selection.setSelectionBounds(null);
      }
    }
  }, [state.currentTool, state.lines, state.images, stopDrawing, stopErasing, syncConfig?.isReceiveOnly, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
