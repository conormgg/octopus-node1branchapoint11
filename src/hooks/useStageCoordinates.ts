
import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('panZoom');

export const useStageCoordinates = (panZoomState: PanZoomState) => {
  const getRelativePointerPosition = useCallback((stage: Konva.Stage, clientX: number, clientY: number) => {
    const rect = stage.container().getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    const { x: stageX, y: stageY } = panZoomState;
    const scale = panZoomState.scale;

    // Correct coordinate transformation: convert screen coordinates to stage coordinates
    // Formula: (screen position - pan offset) / scale
    const stageCoordX = (screenX - stageX) / scale;
    const stageCoordY = (screenY - stageY) / scale;

    debugLog('Coordinates', 'Coordinate transformation', {
      screen: { x: screenX, y: screenY },
      client: { x: clientX, y: clientY },
      panZoom: { x: stageX, y: stageY, scale },
      stageCoords: { x: stageCoordX, y: stageCoordY },
      rect: { left: rect.left, top: rect.top }
    });

    return {
      x: stageCoordX,
      y: stageCoordY
    };
  }, [panZoomState]);

  return { getRelativePointerPosition };
};
