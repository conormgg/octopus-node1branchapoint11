
import { useEffect } from 'react';
import { useEventDeduplication } from './useEventDeduplication';
import { PanZoomState } from '@/types/whiteboard';

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
  const { shouldProcessEvent, resetEventHistory } = useEventDeduplication();
  
  // Touch events for multi-touch gestures - ALWAYS enabled for pan/zoom functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * CRITICAL FIX: Always enable touch events for multi-touch gestures
     * This allows pan/zoom to work on tablets regardless of pointer event support.
     * Touch events will ONLY handle multi-touch (2+ fingers) to avoid conflicts.
     */
    const shouldUseTouchEvents = true; // Always enable for multi-touch

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle multi-touch gestures (2+ fingers)
      if (e.touches.length < 2) {
        return; // Let pointer events handle single-touch
      }

      if (!shouldProcessEvent('touch', 'touchstart')) {
        return;
      }
      
      logEventHandling('touchstart', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // Prevent default for multi-touch to ensure pinch-to-zoom works
      e.preventDefault();
      
      panZoom.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle multi-touch gestures (2+ fingers)  
      if (e.touches.length < 2) {
        return; // Let pointer events handle single-touch
      }

      if (!shouldProcessEvent('touch', 'touchmove')) {
        return;
      }
      
      logEventHandling('touchmove', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // Prevent default for multi-touch gestures
      e.preventDefault();
      
      panZoom.handleTouchMove(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Handle end of multi-touch gestures
      if (e.touches.length === 0 || (e.touches.length === 1 && e.changedTouches.length >= 1)) {
        // End of multi-touch gesture - let pan zoom handle cleanup
        
        if (!shouldProcessEvent('touch', 'touchend')) {
          return;
        }
        
        logEventHandling('touchend', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchEnd(e);
      }
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
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, currentTool, shouldProcessEvent]);
  
  // Reset event history when tool changes
  useEffect(() => {
    resetEventHistory();
  }, [currentTool, resetEventHistory]);
};
