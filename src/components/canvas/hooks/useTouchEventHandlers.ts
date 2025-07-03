
import { useCallback } from 'react';
import Konva from 'konva';
import { Tool } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

interface UseTouchEventHandlersProps {
  currentTool: Tool;
  palmRejectionConfig: { enabled: boolean };
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

import { useTouchHandlers } from '@/hooks/panZoom/useTouchHandlers';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';

export const useTouchEventHandlers = (
  props: UseTouchEventHandlersProps,
  containerRef?: React.RefObject<HTMLElement>,
  stageRef?: React.RefObject<any>,
  panZoomState?: any
) => {
  // Create a coordinate transformation function that uses the current stage reference
  // This ensures we use the minimized view's stage when touching it, not the main stage
  const getRelativePointerPosition = useCallback((stage: any, clientX: number, clientY: number) => {
    // Use the passed stage instead of stageRef to ensure we use the correct stage
    const targetStage = stage || stageRef?.current;
    if (!targetStage) return { x: clientX, y: clientY };
    
    const rect = targetStage.container().getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // For minimized views, use 1:1 coordinate mapping (no pan/zoom transformation)
    // For main stage, apply pan/zoom transformation if panZoomState is provided
    if (panZoomState && (panZoomState.x !== 0 || panZoomState.y !== 0 || panZoomState.scale !== 1)) {
      // This is the main stage with pan/zoom - apply transformation
      return {
        x: (x - panZoomState.x) / panZoomState.scale,
        y: (y - panZoomState.y) / panZoomState.scale
      };
    } else {
      // This is a minimized view or stage without pan/zoom - use direct coordinates
      return { x, y };
    }
  }, [stageRef, panZoomState]);
  
  // Forward the correct coordinate transformation function to useTouchHandlers
  return useTouchHandlers(
    {}, // panHandlers (stub for now)
    () => {}, // zoom (stub for now)
    {}, // panZoomState (stub for now)
    () => {}, // setPanZoomState (stub for now)
    containerRef,
    stageRef,
    getRelativePointerPosition
  );
};
