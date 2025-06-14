
import { usePalmRejection } from './usePalmRejection';
import { PanZoomState } from '@/types/whiteboard';
import { useEventDebug } from './eventHandling/useEventDebug';
import { usePointerEventDetection } from './eventHandling/usePointerEventDetection';
import { useWheelEventHandlers } from './eventHandling/useWheelEventHandlers';
import { useTouchEventHandlers } from './eventHandling/useTouchEventHandlers';
import { useCurrentToolTracking } from './eventHandling/useCurrentToolTracking';
import { usePointerEventHandlers } from './eventHandling/usePointerEventHandlers';
import Konva from 'konva';

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
  // Event debugging utilities
  const { logEventHandling } = useEventDebug(palmRejectionConfig);
  
  // Feature detection
  const { supportsPointerEvents } = usePointerEventDetection();
  
  // Tool tracking
  const { currentToolRef } = useCurrentToolTracking(stageRef);

  // Wheel event handlers
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch event handlers
  useTouchEventHandlers({
    containerRef,
    panZoom,
    logEventHandling
  });

  // Pointer event handlers
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
    logEventHandling
  });
};
