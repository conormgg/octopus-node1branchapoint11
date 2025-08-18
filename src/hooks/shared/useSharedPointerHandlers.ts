
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
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      if (selection.isPointInSelectionBounds) {
        // NOTE: Original select tool hit detection functions removed - findObjectsAtPoint no longer exists
        const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
        
        if (isInSelectionBounds && stableSelectionState?.selectedObjects?.length > 0) {
          // Clicking within selection bounds - this will allow dragging the entire group
          // The actual dragging logic will be handled by the SelectionGroup component
          // We don't need to change the selection here, just maintain it
          return;
        }
        
        // Check for individual objects - original findObjectsAtPoint function removed
        // const foundObjects = selection.findObjectsAtPoint({ x, y }, stableLines, stableImages);
        // Original select tool object finding disabled - use select2 tool for selection
        
        // NOTE: Original select tool selection logic disabled - functions removed
        // Use select2 tool for selection functionality
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
      // NOTE: Original select tool drag-to-select logic disabled - functions removed
      // Use select2 tool for selection functionality
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
      // NOTE: Original select tool drag-to-select completion logic disabled - functions removed
      // Use select2 tool for selection functionality
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState?.isSelecting, stableSelectionState?.selectionBounds, stopDrawing, stopErasing, isReceiveOnly, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
