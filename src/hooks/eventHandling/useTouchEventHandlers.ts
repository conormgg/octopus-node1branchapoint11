
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

    // STAGE 3: Enhanced condition check with fallback safety
    const shouldUseTouchEvents = !supportsPointerEvents || !palmRejectionEnabled;

    // STAGE 3: Wrap handlers in try-catch for error safety
    const handleTouchStart = (e: TouchEvent) => {
      try {
        logEventHandling('touchstart', 'touch', { touches: e.touches.length });
        e.preventDefault(); // Prevent iOS context menu
        panZoom.handleTouchStart(e);
      } catch (error) {
        console.error('[EventDebug] Stage 3: Error in touch start handler:', error);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      try {
        logEventHandling('touchmove', 'touch', { touches: e.touches.length });
        e.preventDefault(); // Prevent scrolling and selection
        panZoom.handleTouchMove(e);
      } catch (error) {
        console.error('[EventDebug] Stage 3: Error in touch move handler:', error);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      try {
        logEventHandling('touchend', 'touch', { touches: e.touches.length });
        e.preventDefault(); // Prevent default touch behaviors
        panZoom.handleTouchEnd(e);
      } catch (error) {
        console.error('[EventDebug] Stage 3: Error in touch end handler:', error);
      }
    };

    // STAGE 3: Add touch event listeners with error handling
    if (shouldUseTouchEvents) {
      try {
        console.log('[EventDebug] Stage 3: Registering touch event listeners with error boundaries');
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: false });
      } catch (error) {
        console.error('[EventDebug] Stage 3: Failed to register touch events:', error);
      }
    } else {
      console.log('[EventDebug] Stage 3: Skipping touch event listeners - pointer events are handling input');
    }

    return () => {
      try {
        if (shouldUseTouchEvents) {
          console.log('[EventDebug] Stage 3: Removing touch event listeners');
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
        }
      } catch (error) {
        console.error('[EventDebug] Stage 3: Error during touch cleanup:', error);
      }
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, supportsPointerEvents, palmRejectionEnabled]);
};
