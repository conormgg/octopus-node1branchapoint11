
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
      if (newTool && newTool !== currentToolRef.current) {
        currentToolRef.current = newTool;
        // Update touch-action when tool changes
        const container = containerRef.current;
        if (container) {
          // For select tool, allow native touch behavior; for others, prevent it
          container.style.touchAction = newTool === 'select' ? 'manipulation' : 'none';
        }
      }
    };
    
    // Initial update
    updateTool();
    
    // Listen for attribute changes
    const interval = setInterval(updateTool, 100);
    
    return () => clearInterval(interval);
  }, [stageRef, containerRef]);

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
