
import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';
import { useStageContext } from '@/contexts/StageContext';

export const useStageCoordinates = (panZoomState: PanZoomState) => {
  const { mainStageContainerRef } = useStageContext();

  const getRelativePointerPosition = useCallback((stage: Konva.Stage, clientX: number, clientY: number) => {
    if (!mainStageContainerRef?.current) {
      // Fallback to stage container if main stage context is not available
      console.warn('[useStageCoordinates] Main stage container not available, falling back to local stage');
      const rect = stage.container().getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      const { x: stageX, y: stageY } = panZoomState;
      const scale = panZoomState.scale;

      return {
        x: (x - stageX) / scale,
        y: (y - stageY) / scale
      };
    }
    
    // ALWAYS use the main stage container for consistent coordinate calculations
    const rect = mainStageContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const { x: stageX, y: stageY } = panZoomState;
    const scale = panZoomState.scale;

    return {
      x: (x - stageX) / scale,
      y: (y - stageY) / scale
    };
  }, [panZoomState, mainStageContainerRef]);

  return { getRelativePointerPosition };
};
