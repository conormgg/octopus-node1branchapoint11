
import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';

export const usePointerHandlers = (
  state: { currentTool: string },
  startDrawing: (x: number, y: number) => void,
  startErasing: (x: number, y: number) => void,
  continueDrawing: (x: number, y: number) => void,
  continueErasing: (x: number, y: number) => void,
  stopDrawing: () => void,
  stopErasing: () => void,
  syncConfig?: SyncConfig
) => {
  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, syncConfig?.isReceiveOnly]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig?.isReceiveOnly]);

  // Handle pointer up
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
