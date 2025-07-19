
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
  isReadOnly
}: UseStageEventHandlersProps) => {
  const currentToolRef = useRef<string>('pencil');
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  const { supportsPointerEvents } = usePointerEventDetection();

  // Update current tool ref by tracking the stage attribute
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const updateTool = () => {
      const newTool = stage.getAttr('currentTool') as string;
      const previousTool = currentToolRef.current;
      
      if (newTool && newTool !== currentToolRef.current) {
        debugLog('StageEventHandlers', 'Tool changed', {
          previousTool,
          newTool,
          wasUndefined: previousTool === undefined,
          nowUndefined: newTool === undefined
        });
        
        currentToolRef.current = newTool;
        // Update touch-action when tool changes
        const container = containerRef.current;
        if (container) {
          // For select tool, allow native touch behavior; for others, prevent it
          container.style.touchAction = newTool === 'select' ? 'manipulation' : 'none';
          debugLog('StageEventHandlers', 'Updated touch-action', {
            tool: newTool,
            touchAction: container.style.touchAction
          });
        }
      }
    };
    
    // Initial update
    updateTool();
    
    // Listen for attribute changes
    const interval = setInterval(updateTool, 100);
    
    return () => clearInterval(interval);
  }, [stageRef, containerRef]);

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
