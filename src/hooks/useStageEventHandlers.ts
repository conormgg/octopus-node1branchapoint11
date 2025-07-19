
import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { usePalmRejection } from './usePalmRejection';
import { useStageCoordinates } from './useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useEventDebug } from './eventHandling/useEventDebug';
import { useWheelEventHandlers } from './eventHandling/useWheelEventHandlers';
import { useTouchEventHandlers } from './eventHandling/useTouchEventHandlers';
import { usePointerEventHandlers } from './eventHandling/usePointerEventHandlers';
import { usePointerEventDetection } from './eventHandling/usePointerEventDetection';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

interface UseStageEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    handleWheel: (e: WheelEvent) => void;
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  currentTool: string;
}

export const useStageEventHandlers = ({
  containerRef,
  stageRef,
  panZoomState,
  palmRejection,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  currentTool
}: UseStageEventHandlersProps) => {
  const currentToolRef = useRef<string>(currentTool || 'pencil');
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  const { supportsPointerEvents } = usePointerEventDetection();

  // Update current tool ref when currentTool prop changes
  useEffect(() => {
    if (currentTool && currentTool !== currentToolRef.current) {
      debugLog('StageEventHandlers', 'Tool changed via prop', {
        previousTool: currentToolRef.current,
        newTool: currentTool
      });
      
      currentToolRef.current = currentTool;
      
      // Update touch-action when tool changes
      const container = containerRef.current;
      if (container) {
        // For select tool, allow native touch behavior; for others, prevent it
        container.style.touchAction = currentTool === 'select' ? 'manipulation' : 'none';
        debugLog('StageEventHandlers', 'Updated touch-action via prop', {
          tool: currentTool,
          touchAction: container.style.touchAction
        });
      }
    }
  }, [currentTool, containerRef]);

  // Log current tool state periodically for debugging
  useEffect(() => {
    const logToolState = () => {
      const stage = stageRef.current;
      const stageAttr = stage?.getAttr('currentTool');
      debugLog('StageEventHandlers', 'Tool state check', {
        refTool: currentToolRef.current,
        stageAttr,
        refUndefined: currentToolRef.current === undefined,
        stageUndefined: stageAttr === undefined,
        match: currentToolRef.current === stageAttr
      });
    };
    
    const interval = setInterval(logToolState, 2000);
    return () => clearInterval(interval);
  }, [stageRef]);

  // Wheel event handlers - always active for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events for multi-touch gestures - ALWAYS enabled now
  useTouchEventHandlers({
    containerRef,
    panZoom,
    logEventHandling,
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled,
    currentTool: currentToolRef.current
  });

  // Pointer event handlers - handles single-touch interactions
  usePointerEventHandlers({
    containerRef,
    stageRef,
    panZoomState,
    palmRejection,
    palmRejectionConfig,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isReadOnly,
    currentToolRef,
    logEventHandling,
    supportsPointerEvents
  });
};
