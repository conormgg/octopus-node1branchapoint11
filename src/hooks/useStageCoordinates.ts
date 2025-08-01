
import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';

export const useStageCoordinates = (panZoomState: PanZoomState) => {
  const getRelativePointerPosition = useCallback((stage: Konva.Stage, clientX: number, clientY: number) => {
    const rect = stage.container().getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const { x: stageX, y: stageY } = panZoomState;
    const scale = panZoomState.scale;

    return {
      x: (x - stageX) / scale,
      y: (y - stageY) / scale
    };
  }, [panZoomState]);

  const worldToScreen = useCallback((stage: Konva.Stage, worldX: number, worldY: number) => {
    const rect = stage.container().getBoundingClientRect();
    const { x: stageX, y: stageY } = panZoomState;
    const scale = panZoomState.scale;

    return {
      x: rect.left + (worldX * scale) + stageX,
      y: rect.top + (worldY * scale) + stageY
    };
  }, [panZoomState]);

  return { getRelativePointerPosition, worldToScreen };
};
