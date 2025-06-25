
import Konva from 'konva';
import { usePalmRejection } from '../usePalmRejection';
import { PanZoomState } from '@/types/whiteboard';
import { usePointerEventCore } from './pointerEvents/usePointerEventCore';
import { usePointerEventSetup } from './pointerEvents/usePointerEventSetup';

interface UsePointerEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  currentToolRef: React.RefObject<string>;
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: Record<string, unknown>) => void;
  supportsPointerEvents: boolean;
}

export const usePointerEventHandlers = ({
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
}: UsePointerEventHandlersProps) => {
  /**
   * Always use pointer events when supported for stylus functionality.
   * Palm rejection filtering is applied conditionally within the event handlers.
   */
  const shouldUsePointerEvents = supportsPointerEvents;

  // Get all pointer event handlers
  const handlers = usePointerEventCore({
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

  // Set up event listeners
  usePointerEventSetup({
    containerRef,
    shouldUsePointerEvents,
    handlers
  });
};
