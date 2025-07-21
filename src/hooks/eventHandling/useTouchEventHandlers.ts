
import { useEffect } from 'react';
import { useEventDeduplication } from './useEventDeduplication';
import { useMultiTouchDetection } from './useMultiTouchDetection';
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
  const multiTouchDetection = useMultiTouchDetection();
  
  // Touch events for multi-touch gestures - ALWAYS enabled and PRIORITIZED
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDrawingTool = currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser';

    const handleTouchStart = (e: TouchEvent) => {
      // Update multi-touch detection immediately
      multiTouchDetection.setActiveTouches(e.touches.length);

      debugLog('TouchEventHandlers', 'Touch start received', {
        touches: e.touches.length,
        currentTool,
        toolUndefined: currentTool === undefined,
        supportsPointerEvents,
        isMultiTouch: e.touches.length >= 2,
        isDrawingTool
      });

      // CRITICAL: Handle multi-touch gestures with highest priority
      if (e.touches.length >= 2) {
        debugLog('TouchEventHandlers', 'Multi-touch gesture detected - preventing pointer interference');
        
        // Aggressively prevent default and stop propagation for multi-touch
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (!shouldProcessEvent('touch', 'touchstart')) {
          debugLog('TouchEventHandlers', 'Event deduplication blocked touchstart');
          return;
        }
        
        logEventHandling('touchstart', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchStart(e);
        return;
      }

      // For single-touch drawing tools, be more aggressive about preventing magnifier
      if (isDrawingTool) {
        debugLog('TouchEventHandlers', 'Single touch drawing tool - preventing magnifier');
        
        // Prevent magnifier and text selection for drawing tools
        e.preventDefault();
        e.stopPropagation();
        
        // Set strict touch-action on container
        container.style.touchAction = 'none';
        container.style.webkitUserSelect = 'none';
        container.style.webkitTouchCallout = 'none';
        
        if (!shouldProcessEvent('touch', 'touchstart')) {
          debugLog('TouchEventHandlers', 'Event deduplication blocked touchstart');
          return;
        }
        
        logEventHandling('touchstart', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchStart(e);
        return;
      }

      // For single-touch, let pointer events handle it unless they're not supported
      if (!supportsPointerEvents) {
        debugLog('TouchEventHandlers', 'No pointer events support - handling single touch');
        
        if (!shouldProcessEvent('touch', 'touchstart')) {
          debugLog('TouchEventHandlers', 'Event deduplication blocked touchstart');
          return;
        }
        
        logEventHandling('touchstart', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchStart(e);
      } else {
        debugLog('TouchEventHandlers', 'Single touch - deferring to pointer events');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Update multi-touch detection
      multiTouchDetection.setActiveTouches(e.touches.length);

      // CRITICAL: Handle multi-touch gestures with highest priority
      if (e.touches.length >= 2) {
        debugLog('TouchEventHandlers', 'Multi-touch move - preventing pointer interference');
        
        // Aggressively prevent default and stop propagation for multi-touch
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (!shouldProcessEvent('touch', 'touchmove')) {
          return;
        }
        
        logEventHandling('touchmove', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchMove(e);
        return;
      }

      // For single-touch drawing tools, maintain strict control
      if (isDrawingTool) {
        debugLog('TouchEventHandlers', 'Single touch drawing tool move - maintaining strict control');
        
        // Prevent any unwanted behaviors during drawing
        e.preventDefault();
        e.stopPropagation();
        
        if (!shouldProcessEvent('touch', 'touchmove')) {
          return;
        }
        
        logEventHandling('touchmove', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchMove(e);
        return;
      }

      // For single-touch, let pointer events handle it unless they're not supported
      if (!supportsPointerEvents) {
        debugLog('TouchEventHandlers', 'No pointer events support - handling single touch move');
        
        if (!shouldProcessEvent('touch', 'touchmove')) {
          return;
        }
        
        logEventHandling('touchmove', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchMove(e);
      } else {
        debugLog('TouchEventHandlers', 'Single touch move - deferring to pointer events');
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Update multi-touch detection
      multiTouchDetection.setActiveTouches(e.touches.length);

      debugLog('TouchEventHandlers', 'Touch end received', {
        remainingTouches: e.touches.length,
        changedTouches: e.changedTouches.length,
        currentTool,
        wasMultiTouch: e.touches.length + e.changedTouches.length >= 2,
        isDrawingTool
      });

      // Restore touch-action when drawing ends
      if (isDrawingTool && e.touches.length === 0) {
        container.style.touchAction = palmRejectionEnabled ? 'manipulation' : 'auto';
      }

      // Handle end of multi-touch gestures or fallback when no pointer events
      if (e.touches.length + e.changedTouches.length >= 2 || !supportsPointerEvents || isDrawingTool) {
        debugLog('TouchEventHandlers', 'Handling touch end');
        
        if (!shouldProcessEvent('touch', 'touchend')) {
          return;
        }
        
        logEventHandling('touchend', 'touch', { 
          touches: e.touches.length, 
          tool: currentTool 
        });
        
        panZoom.handleTouchEnd(e);
      } else {
        debugLog('TouchEventHandlers', 'Single touch end - deferring to pointer events');
      }
    };

    debugLog('TouchEventHandlers', 'Setting up touch event listeners with capture', {
      currentTool,
      supportsPointerEvents,
      isDrawingTool
    });

    // Use capture phase to intercept touch events before they reach pointer events
    container.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });

    return () => {
      debugLog('TouchEventHandlers', 'Cleaning up touch event listeners');
      container.removeEventListener('touchstart', handleTouchStart, { passive: false, capture: true } as any);
      container.removeEventListener('touchmove', handleTouchMove, { passive: false, capture: true } as any);
      container.removeEventListener('touchend', handleTouchEnd, { passive: false, capture: true } as any);
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, currentTool, shouldProcessEvent, supportsPointerEvents, multiTouchDetection, palmRejectionEnabled]);
  
  // Reset event history when tool changes
  useEffect(() => {
    debugLog('TouchEventHandlers', 'Tool changed - resetting event history', {
      currentTool,
      toolUndefined: currentTool === undefined
    });
    resetEventHistory();
    multiTouchDetection.reset();
  }, [currentTool, resetEventHistory, multiTouchDetection]);
};
