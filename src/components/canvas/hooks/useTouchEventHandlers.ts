
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

export const useTouchEventHandlers = ({
  currentTool,
  palmRejectionConfig,
  onStageClick
}: UseTouchEventHandlersProps) => {
  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    debugLog('TouchEvents', 'touchstart from konva', {
      touches: e.evt.touches.length,
      currentTool,
      palmRejectionEnabled: palmRejectionConfig.enabled
    });
    
    if (onStageClick) onStageClick(e);
  }, [currentTool, palmRejectionConfig.enabled, onStageClick]);

  return {
    handleTouchStart
  };
};
