
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
    }
  }, [stableCurrentTool, stableLines, stableImages, stableSelectionState?.isSelecting, stableSelectionState?.selectionBounds, stopDrawing, stopErasing, isReceiveOnly, selection]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
