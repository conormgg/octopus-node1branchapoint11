
import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';

export const useStageCoordinates = (panZoomState: PanZoomState) => {
  const getRelativePointerPosition = useCallback((stage: Konva.Stage, clientX: number, clientY: number) => {
    const rect = stage.container().getBoundingClientRect();
    
    // Get screen coordinates relative to stage container
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    console.log('[StageCoordinates] Screen coordinates:', { screenX, screenY });
    console.log('[StageCoordinates] Pan/Zoom state:', panZoomState);
    
    // CORRECTED TRANSFORMATION FORMULA:
    // To convert from screen coordinates to world coordinates:
    // world = (screen - pan) / scale
    const worldX = (screenX - panZoomState.x) / panZoomState.scale;
    const worldY = (screenY - panZoomState.y) / panZoomState.scale;
    
    console.log('[StageCoordinates] Calculated world coordinates:', { worldX, worldY });
    
    // Verify with Konva's built-in method as a sanity check
    try {
      const konvaPosition = stage.getPointerPosition();
      if (konvaPosition) {
        console.log('[StageCoordinates] Konva built-in position:', konvaPosition);
        
        // Log any discrepancy
        const deltaX = Math.abs(worldX - konvaPosition.x);
        const deltaY = Math.abs(worldY - konvaPosition.y);
        if (deltaX > 1 || deltaY > 1) {
          console.warn('[StageCoordinates] Position mismatch detected:', {
            calculated: { x: worldX, y: worldY },
            konva: konvaPosition,
            delta: { deltaX, deltaY }
          });
        }
      }
    } catch (e) {
      console.log('[StageCoordinates] Konva getPointerPosition not available');
    }

    return {
      x: worldX,
      y: worldY
    };
  }, [panZoomState]);

  return { getRelativePointerPosition };
};
