
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

  // STAGE 2: Log the event system selection
  console.log('[EventDebug] Stage 2: Event system selection', {
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled,
    willUsePointerEvents: supportsPointerEvents && palmRejectionConfig.enabled,
    willUseTouchEvents: !supportsPointerEvents || !palmRejectionConfig.enabled
  });

  // Wheel event handlers
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch event handlers - STAGE 2: Pass pointer event detection
  useTouchEventHandlers({
    containerRef,
    panZoom,
    logEventHandling,
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled
  });

  // Pointer event handlers - STAGE 2: Pass pointer event detection
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
