
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
  stageRef?: React.RefObject<any>
) => {
  // Get the same coordinate transformation function used by drawing logic
  const { getRelativePointerPosition } = useStageCoordinates({} as any); // Pass empty panZoomState for now
  
  // Forward the getRelativePointerPosition function to useTouchHandlers for debug finger points
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
