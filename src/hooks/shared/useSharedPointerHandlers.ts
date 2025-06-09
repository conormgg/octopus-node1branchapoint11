
import { useCallback } from 'react';
import { Tool } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';

export const useSharedPointerHandlers = (
  state: { currentTool: Tool },
  startDrawing: (x: number, y: number) => void,
  continueDrawing: (x: number, y: number) => void,
  stopDrawing: () => void,
  startErasing: (x: number, y: number) => void,
  continueErasing: (x: number, y: number) => void,
  stopErasing: () => void,
  syncConfig: SyncConfig | undefined,
  panZoom: any
) => {
  // Handle pointer down - only for drawing operations
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode or during pan/zoom gestures
    if (syncConfig?.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, syncConfig?.isReceiveOnly, panZoom]);

  // Handle pointer move - only for drawing operations
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode or during pan/zoom gestures
    if (syncConfig?.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig?.isReceiveOnly, panZoom]);

  // Handle pointer up - only for drawing operations
  const handlePointerUp = useCallback(() => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    }
  }, [state.currentTool, stopDrawing, stopErasing, syncConfig?.isReceiveOnly]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
