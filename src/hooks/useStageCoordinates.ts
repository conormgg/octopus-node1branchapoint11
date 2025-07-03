
import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';

export const useStageCoordinates = (panZoomState: PanZoomState) => {
  const getRelativePointerPosition = useCallback((stage: Konva.Stage, clientX: number, clientY: number) => {
    const rect = stage.container().getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Check if this is a minimized view by comparing container size to stage size
    // For minimized views, we want 1:1 coordinate mapping without pan/zoom transformation
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    const isMinimizedView = rect.width < stageWidth || rect.height < stageHeight;
    
    if (isMinimizedView) {
      // For minimized view: direct 1:1 mapping (viewport coordinates)
      return { x, y };
    } else {
      // For main stage: apply pan/zoom transformation (world coordinates)
      const { x: stageX, y: stageY } = panZoomState;
      const scale = panZoomState.scale;
      return {
        x: (x - stageX) / scale,
        y: (y - stageY) / scale
      };
    }
  }, [panZoomState]);

  return { getRelativePointerPosition };
};
