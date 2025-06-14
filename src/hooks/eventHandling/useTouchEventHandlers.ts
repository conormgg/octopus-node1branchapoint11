
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

    // STAGE 2: Only register touch events if we're NOT using pointer events
    const shouldUseTouchEvents = !supportsPointerEvents || !palmRejectionEnabled;

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

    // STAGE 2: Only add touch event listeners if we should use them
    if (shouldUseTouchEvents) {
      console.log('[EventDebug] Stage 2: Registering touch event listeners (pointer events not used)');
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    } else {
      console.log('[EventDebug] Stage 2: Skipping touch event listeners - using pointer events instead');
    }

    return () => {
      if (shouldUseTouchEvents) {
        console.log('[EventDebug] Stage 2: Removing touch event listeners');
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, supportsPointerEvents, palmRejectionEnabled]);
};
