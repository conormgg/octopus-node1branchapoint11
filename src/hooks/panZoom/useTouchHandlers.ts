
import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

export const useTouchHandlers = (
  panHandlers: any,
  zoom: (factor: number, centerX?: number, centerY?: number) => void,
  currentTool?: string
) => {
  // Track touch state for pinch-to-zoom
  const touchStateRef = useRef<{
    lastDistance: number;
    lastCenter: { x: number; y: number };
  }>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 }
  });

  const getTouchDistance = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    debugLog('TouchHandlers', 'Touch start', {
      touches: e.touches.length,
      currentTool,
      toolUndefined: currentTool === undefined,
      toolType: typeof currentTool
    });
    
    // ONLY handle multi-touch gestures (2+ fingers)
    // Single-touch is now handled by pointer events
    if (e.touches.length >= 2) {
      debugLog('TouchHandlers', 'Processing multi-touch gesture', {
        touches: e.touches.length,
        currentTool
      });
      panHandlers.setIsGestureActiveState(true);
      // Initialize pinch-to-zoom
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
      
      // For 2-finger pan, use the center point
      if (e.touches.length === 2) {
        const center = getTouchCenter(e.touches);
        panHandlers.startPan(center.x, center.y);
      }
    } else {
      debugLog('TouchHandlers', 'Single touch - should be handled by pointer events', {
        touches: e.touches.length,
        currentTool,
        shouldBeSelection: false
      });
    }
    // Single touches are completely ignored - handled by pointer events
  }, [getTouchDistance, getTouchCenter, panHandlers, currentTool]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    debugLog('TouchHandlers', 'Touch move', {
      touches: e.touches.length,
      currentTool
    });
    
    // ONLY handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      debugLog('TouchHandlers', 'Processing multi-touch move', {
        touches: e.touches.length
      });
      // Multi-touch: handle pinch-to-zoom and 2-finger pan
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);
      
      const { lastDistance } = touchStateRef.current;
      
      if (lastDistance > 0) {
        const zoomFactor = currentDistance / lastDistance;
        
        // Get the container element to calculate proper viewport coordinates
        const target = e.target as HTMLElement;
        const container = target.closest('[data-whiteboard-id]') || target;
        const rect = container.getBoundingClientRect();
        
        // Convert touch center to viewport coordinates
        const viewportCenterX = currentCenter.x - rect.left;
        const viewportCenterY = currentCenter.y - rect.top;
        
        debugLog('TouchHandlers', 'Pinch zoom', {
          factor: zoomFactor,
          center: { x: viewportCenterX, y: viewportCenterY }
        });
        
        // Zoom centered on the pinch point
        zoom(zoomFactor, viewportCenterX, viewportCenterY);
      }
      
      // Two-finger pan (only if not zooming significantly)
      if (e.touches.length === 2 && Math.abs(currentDistance - lastDistance) < 10) {
        panHandlers.continuePan(currentCenter.x, currentCenter.y);
      }
      
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = currentCenter;
    } else {
      debugLog('TouchHandlers', 'Single touch move - ignoring', {
        touches: e.touches.length,
        currentTool
      });
    }
    // Single touches are ignored - handled by pointer events
  }, [getTouchDistance, getTouchCenter, zoom, panHandlers, currentTool]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    debugLog('TouchHandlers', 'Touch end', {
      remainingTouches: e.touches.length,
      changedTouches: e.changedTouches.length,
      currentTool
    });
    
    // Reset gesture state when no touches remain or going from multi to single touch
    if (e.touches.length === 0) {
      debugLog('TouchHandlers', 'All touches ended - stopping pan', {
        currentTool
      });
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
    } else if (e.touches.length === 1) {
      // When going from multi-touch to single touch, stop multi-touch gesture
      debugLog('TouchHandlers', 'Multi-touch to single touch - stopping pan', {
        currentTool
      });
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
    }
    // Continue multi-touch handling if still multiple touches
  }, [panHandlers, currentTool]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
