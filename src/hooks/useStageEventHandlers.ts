
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

  // STAGE 3: Enhanced event system selection with fallback validation
  const willUsePointerEvents = supportsPointerEvents && palmRejectionConfig.enabled;
  const willUseTouchEvents = !supportsPointerEvents || !palmRejectionConfig.enabled;

  console.log('[EventDebug] Stage 3: Event system selection with fallback safety', {
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled,
    willUsePointerEvents,
    willUseTouchEvents,
    hasContainer: !!containerRef.current,
    hasStage: !!stageRef.current
  });

  // STAGE 3: Ensure at least one event system is always active
  if (!willUsePointerEvents && !willUseTouchEvents) {
    console.warn('[EventDebug] Stage 3: No event system would be active! Falling back to touch events');
  }

  // Wheel event handlers - always active
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch event handlers - STAGE 3: With enhanced fallback
  useTouchEventHandlers({
    containerRef,
    panZoom,
    logEventHandling,
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig.enabled
  });

  // Pointer event handlers - STAGE 3: With enhanced fallback  
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
