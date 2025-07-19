
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
  currentTool?: string;
}

export const useTouchEventHandlers = ({
  containerRef,
  panZoom,
  logEventHandling,
  supportsPointerEvents,
  palmRejectionEnabled,
  currentTool
}: UseTouchEventHandlersProps) => {
  // Touch events for pinch/pan - works regardless of read-only status
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * Touch events are used ONLY when pointer events are not supported.
     * This prevents conflicts between pointer and touch event systems.
     * 
     * IMPORTANT: When select tool is active, single-finger touches should 
     * bypass pan logic and be handled by selection logic instead.
     */
    const shouldUseTouchEvents = !supportsPointerEvents;

    const handleTouchStart = (e: TouchEvent) => {
      logEventHandling('touchstart', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // For select tool with single finger, only prevent default but don't handle pan
      if (currentTool === 'select' && e.touches.length === 1) {
        // Let selection logic handle this touch
        return;
      }
      
      // Always prevent default for multi-touch to ensure pinch-to-zoom works
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      
      panZoom.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      logEventHandling('touchmove', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // For select tool with single finger, only prevent default but don't handle pan
      if (currentTool === 'select' && e.touches.length === 1) {
        // Let selection logic handle this touch
        return;
      }
      
      // Always prevent default for multi-touch gestures
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      
      panZoom.handleTouchMove(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      logEventHandling('touchend', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // For select tool, let selection logic handle touch end
      if (currentTool === 'select') {
        // Still prevent default behaviors but don't interfere with selection
        if (e.touches.length >= 1 || (e.changedTouches && e.changedTouches.length >= 1)) {
          e.preventDefault();
        }
        return;
      }
      
      // Only prevent default for multi-touch end events
      if (e.touches.length >= 1 || (e.changedTouches && e.changedTouches.length >= 1)) {
        e.preventDefault();
      }
      
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
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, supportsPointerEvents, currentTool]);
};
