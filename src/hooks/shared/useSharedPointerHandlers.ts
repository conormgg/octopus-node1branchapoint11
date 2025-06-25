
import { useCallback, useMemo } from 'react';
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
  // Memoize stable references to prevent unnecessary re-renders
  const isReceiveOnly = useMemo(() => syncConfig?.isReceiveOnly, [syncConfig?.isReceiveOnly]);
  const stableCurrentTool = useMemo(() => state.currentTool, [state.currentTool]);
  const stableLines = useMemo(() => state.lines, [state.lines]);
  const stableImages = useMemo(() => state.images, [state.images]);
  const stableSelectionState = useMemo(() => selection?.selectionState, [selection?.selectionState]);

  // Handle pointer down - for drawing and selection operations
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow operations in receive-only mode or during pan/zoom gestures
    if (isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (stableCurrentTool === 'pencil' || stableCurrentTool === 'highlighter') {
      startDrawing(x, y);
    } else if (stableCurrentTool === 'eraser') {
      startErasing(x, y);
    } else if (stableCurrentTool === 'select' && selection) {
      // Handle selection logic with priority and safety checks:
      // Priority 1: Check if clicking within existing multi-object selection bounds
      if (selection.isPointInSelectionBounds && selection.findObjectsAtPoint && selection.selectObjects && selection.setIsSelecting && selection.setSelectionBounds && selection.clearSelection) {
        
        if (stableSelectionState?.selectedObjects?.length > 1 && selection.isPointInSelectionBounds({ x, y })) {
          // Clicking within group selection bounds - let Konva handle group drag
          // Do nothing and allow event to pass through
          return;
        }
        
        // Priority 2: Check for individual objects
        const foundObjects = selection.findObjectsAtPoint({ x, y }, stableLines, stableImages);
        
        if (foundObjects.length > 0) {
          // Select the first found object using atomic update
          selection.selectObjects([foundObjects[0]], stableLines, stableImages);
        } else {
          // Priority 3: Clear selection when clicking on empty space
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
          // Find objects within selection bounds and use atomic update
          const objectsInBounds = selection.findObjectsInBounds(bounds, stableLines, stableImages);
          selection.selectObjects(objectsInBounds, stableLines, stableImages);
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
