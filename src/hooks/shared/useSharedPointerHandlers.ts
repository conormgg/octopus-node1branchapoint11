
import { useCallback, useMemo } from 'react';
import { Tool } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';

/**
 * Helper function to check if a click target is a transformer handle
 */
const isTransformerHandle = (target: any): boolean => {
  if (!target) return false;
  
  // Check if the target is a transformer or transformer-related element
  const className = target.getClassName ? target.getClassName() : '';
  const name = target.name ? target.name() : '';
  
  return (
    className === 'Transformer' ||
    name.includes('_anchor') ||
    name.includes('rotater') ||
    target.parent?.getClassName?.() === 'Transformer'
  );
};

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
  // Memoize stable references to prevent unnecessary re-renders
  const isReceiveOnly = useMemo(() => syncConfig?.isReceiveOnly, [syncConfig?.isReceiveOnly]);
  const stableCurrentTool = useMemo(() => state.currentTool, [state.currentTool]);
  const stableLines = useMemo(() => state.lines, [state.lines]);
  const stableImages = useMemo(() => state.images, [state.images]);
  const stableSelectionState = useMemo(() => selection?.selectionState, [selection?.selectionState]);

  // Handle pointer down - for drawing and selection operations
  const handlePointerDown = useCallback((x: number, y: number, konvaEvent?: any) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      startDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      startErasing(x, y);
    } else if (stableCurrentTool === 'select' && selection) {
      // Check if clicking on transformer handles - if so, don't interfere with selection
      if (konvaEvent && isTransformerHandle(konvaEvent.target)) {
        return;
      }
      
      // Handle selection logic with priority and safety checks:
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      if (selection.isPointInSelectionBounds && selection.findObjectsAtPoint && selection.selectObjects && selection.setIsSelecting && selection.setSelectionBounds && selection.clearSelection) {
        const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
        
        if (isInSelectionBounds && stableSelectionState?.selectedObjects?.length > 0) {
          // Clicking within selection bounds - this will allow dragging the entire group
          // The actual dragging logic will be handled by the SelectionGroup component
          // We don't need to change the selection here, just maintain it
          return;
        }
        
        // Check for individual objects
        const foundObjects = selection.findObjectsAtPoint({ x, y }, stableLines, stableImages);
        
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
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState?.selectedObjects?.length, startDrawing, startErasing, isReceiveOnly, panZoom, selection]);

  // Handle pointer move - for drawing and selection operations
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      continueDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      continueErasing(x, y);
    } else if (stableCurrentTool === 'select' && selection && stableSelectionState?.isSelecting) {
      // Update drag-to-select rectangle with safety checks
      if (selection.setSelectionBounds && stableSelectionState.selectionBounds) {
        const bounds = stableSelectionState.selectionBounds;
        const newBounds = {
          x: Math.min(bounds.x, x),
          y: Math.min(bounds.y, y),
          width: Math.abs(x - bounds.x),
          height: Math.abs(y - bounds.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [stableCurrentTool, stableSelectionState?.isSelecting, stableSelectionState?.selectionBounds, continueDrawing, continueErasing, isReceiveOnly, panZoom, selection]);

  // Handle pointer up - for drawing and selection operations
  const handlePointerUp = useCallback(() => {
    // Don't allow operations in receive-only mode
    if (isReceiveOnly) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      stopDrawing();
    } else if (stableCurrentTool === 'eraser') {
      stopErasing();
    } else if (stableCurrentTool === 'select' && selection && stableSelectionState?.isSelecting) {
      // Complete drag-to-select with safety checks
      if (selection.setIsSelecting && selection.setSelectionBounds && selection.findObjectsInBounds && selection.selectObjects) {
        const bounds = stableSelectionState.selectionBounds;
        if (bounds && (bounds.width > 5 || bounds.height > 5)) {
          // Find objects within selection bounds
          const objectsInBounds = selection.findObjectsInBounds(bounds, stableLines, stableImages);
          selection.selectObjects(objectsInBounds);
        }
        
        // End selection
        selection.setIsSelecting(false);
        selection.setSelectionBounds(null);
      }
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState?.isSelecting, stableSelectionState?.selectionBounds, stopDrawing, stopErasing, isReceiveOnly, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
