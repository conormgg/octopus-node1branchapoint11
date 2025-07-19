
import { useEffect } from 'react';

interface UseTouchEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  panZoom: {
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
  };
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: any) => void;
  supportsPointerEvents: boolean;
  palmRejectionEnabled: boolean;
}

export const useTouchEventHandlers = ({
  containerRef,
  panZoom,
  logEventHandling,
  supportsPointerEvents,
  palmRejectionEnabled
}: UseTouchEventHandlersProps) => {
  // Touch events for pinch/pan - works regardless of read-only status
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * Touch events are used ONLY when pointer events are not supported.
     * This prevents conflicts between pointer and touch event systems.
     */
    const shouldUseTouchEvents = !supportsPointerEvents;

    const handleTouchStart = (e: TouchEvent) => {
      logEventHandling('touchstart', 'touch', { touches: e.touches.length });
      e.preventDefault(); // Prevent iOS context menu
      panZoom.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      logEventHandling('touchmove', 'touch', { touches: e.touches.length });
      e.preventDefault(); // Prevent scrolling and selection
      panZoom.handleTouchMove(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      logEventHandling('touchend', 'touch', { touches: e.touches.length });
      e.preventDefault(); // Prevent default touch behaviors
      panZoom.handleTouchEnd(e);
    };

    if (shouldUseTouchEvents) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (shouldUseTouchEvents) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, supportsPointerEvents]);
};
