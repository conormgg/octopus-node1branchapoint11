
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

  // Track the last event to prevent duplicates
  let lastEventTime = 0;
  let lastEventType = '';
  
  const isDuplicateEvent = (eventType: string, timestamp: number) => {
    const timeDiff = timestamp - lastEventTime;
    const isDupe = lastEventType === eventType && timeDiff < 10; // 10ms threshold
    lastEventTime = timestamp;
    lastEventType = eventType;
    return isDupe;
  };

  // Get all pointer event handlers with deduplication
  const handlers = {
    handlePointerDownEvent: (e: PointerEvent) => {
      if (isDuplicateEvent('pointerdown', e.timeStamp)) {
        return;
      }
      
      logEventHandling('pointer', 'pointer', { type: 'down' });
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handlePointerDown(x, y);
    },
    handlePointerMoveEvent: (e: PointerEvent) => {
      if (isDuplicateEvent('pointermove', e.timeStamp)) {
        return;
      }
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handlePointerMove(x, y);
    },
    handlePointerUpEvent: (e: PointerEvent) => {
      if (isDuplicateEvent('pointerup', e.timeStamp)) {
        return;
      }
      
      logEventHandling('pointer', 'pointer', { type: 'up' });
      handlePointerUp();
    },
    handlePointerLeaveEvent: (e: PointerEvent) => {
      if (isDuplicateEvent('pointerleave', e.timeStamp)) {
        return;
      }
      
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
