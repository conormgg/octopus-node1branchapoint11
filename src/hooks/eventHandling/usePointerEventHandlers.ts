
import Konva from 'konva';
import { usePalmRejection } from '../usePalmRejection';
import { PanZoomState } from '@/types/whiteboard';
import { useStageCoordinates } from '../useStageCoordinates';
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
  handlePointerDown: (x: number, y: number, ctrlKey?: boolean, button?: number, clientX?: number, clientY?: number) => void;
  handlePointerMove: (x: number, y: number, clientX?: number, clientY?: number) => void;
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
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  /**
   * Always use pointer events when supported for stylus functionality.
   * Palm rejection filtering is applied conditionally within the event handlers.
   */
  const shouldUsePointerEvents = supportsPointerEvents;

  // Get all pointer event handlers with proper coordinate transformation
  const handlers = {
    handlePointerDownEvent: (e: PointerEvent) => {
      logEventHandling('pointer', 'pointer', { type: 'down', button: e.button });
      
      const stage = stageRef.current;
      if (!stage) return;

      // Transform screen coordinates to world coordinates
      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerDown(x, y, e.ctrlKey, e.button, e.clientX, e.clientY);
    },
    handlePointerMoveEvent: (e: PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Transform screen coordinates to world coordinates
      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerMove(x, y, e.clientX, e.clientY);
    },
    handlePointerUpEvent: (e: PointerEvent) => {
      logEventHandling('pointer', 'pointer', { type: 'up' });
      handlePointerUp();
    },
    handlePointerLeaveEvent: (e: PointerEvent) => {
      handlePointerUp();
    },
    handleContextMenu: (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Set up event listeners
  usePointerEventSetup({
    containerRef,
    shouldUsePointerEvents,
    handlers
  });
};
