
import { useEffect } from 'react';
import { useEventDeduplication } from './useEventDeduplication';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

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
      debugLog('TouchEventHandlers', 'Touch start received', {
        touches: e.touches.length,
        currentTool,
        toolUndefined: currentTool === undefined,
        supportsPointerEvents,
        willProcessMultiTouch: e.touches.length >= 2
      });

      // Only handle multi-touch gestures (2+ fingers)
      if (e.touches.length < 2) {
        debugLog('TouchEventHandlers', 'Single touch - letting pointer events handle', {
          touches: e.touches.length,
          currentTool,
          shouldBeSelection: currentTool === 'select'
        });
        return; // Let pointer events handle single-touch
      }

      if (!shouldProcessEvent('touch', 'touchstart')) {
        debugLog('TouchEventHandlers', 'Event deduplication blocked touchstart');
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
        debugLog('TouchEventHandlers', 'Single touch move - ignoring', {
          touches: e.touches.length,
          currentTool
        });
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
      debugLog('TouchEventHandlers', 'Touch end received', {
        remainingTouches: e.touches.length,
        changedTouches: e.changedTouches.length,
        currentTool,
        wasMultiTouch: e.touches.length + e.changedTouches.length >= 2
      });

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
      debugLog('TouchEventHandlers', 'Setting up touch event listeners', {
        currentTool,
        supportsPointerEvents
      });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (shouldUseTouchEvents) {
        debugLog('TouchEventHandlers', 'Cleaning up touch event listeners');
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, currentTool, shouldProcessEvent]);
  
  // Reset event history when tool changes
  useEffect(() => {
    debugLog('TouchEventHandlers', 'Tool changed - resetting event history', {
      currentTool,
      toolUndefined: currentTool === undefined
    });
    resetEventHistory();
  }, [currentTool, resetEventHistory]);
};
