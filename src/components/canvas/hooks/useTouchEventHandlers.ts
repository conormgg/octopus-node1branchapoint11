
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
    // SURGICAL FIX: Only prevent default for drawing tools, not selection
    const shouldPreventDefault = currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser';
    
    if (shouldPreventDefault) {
      e.evt.preventDefault();
      debugLog('TouchEvents', 'touchstart with preventDefault for drawing tool', {
        touches: e.evt.touches.length,
        currentTool,
        palmRejectionEnabled: palmRejectionConfig.enabled
      });
    } else {
      debugLog('TouchEvents', 'touchstart without preventDefault for selection tool', {
        touches: e.evt.touches.length,
        currentTool,
        palmRejectionEnabled: palmRejectionConfig.enabled
      });
    }
    
    if (onStageClick) onStageClick(e);
  }, [currentTool, palmRejectionConfig.enabled, onStageClick]);

  return {
    handleTouchStart
  };
};
