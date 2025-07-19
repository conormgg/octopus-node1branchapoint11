
import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';

/**
 * Returns a function that maps client (screen) coordinates to whiteboard (canvas) coordinates,
 * using the actual bounding rect of the Konva Stage element and the latest pan/zoom state.
 * This logic is robust and matches the working implementation from stage2point4.
 */
export const useStageCoordinates = (panZoomState: PanZoomState) => {
  const getRelativePointerPosition = useCallback(
    (stage: Konva.Stage, clientX: number, clientY: number) => {
      // Use the actual bounding rect of the stage's container
      const rect = stage.container().getBoundingClientRect();
      // Calculate pointer position relative to the top-left of the stage
      const pointerX = clientX - rect.left;
      const pointerY = clientY - rect.top;

      // Apply pan and zoom transform
      const { x: panX, y: panY, scale } = panZoomState;

      // Map to whiteboard coordinates
      return {
        x: (pointerX - panX) / scale,
        y: (pointerY - panY) / scale,
      };
    },
    [panZoomState]
  );

  return { getRelativePointerPosition };
};
