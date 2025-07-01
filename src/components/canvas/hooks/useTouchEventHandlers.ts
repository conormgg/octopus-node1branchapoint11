
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

export const useTouchEventHandlers = (
  props: UseTouchEventHandlersProps,
  containerRef?: React.RefObject<HTMLElement>,
  stageRef?: React.RefObject<any>
) => {
  // You may need to pass additional pan/zoom state and handlers here as needed for your app
  // For now, just forward the stageRef to useTouchHandlers for debug finger points
  // (You may need to adapt this to your actual pan/zoom integration)
  return useTouchHandlers(
    {}, // panHandlers (stub for now)
    () => {}, // zoom (stub for now)
    {}, // panZoomState (stub for now)
    () => {}, // setPanZoomState (stub for now)
    containerRef,
    stageRef
  );
};
