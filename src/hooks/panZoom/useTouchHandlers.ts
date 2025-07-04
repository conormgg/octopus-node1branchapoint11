
import { useCallback, useRef } from 'react';

export const useTouchHandlers = (
  panHandlers: any,
  zoom: (factor: number, centerX?: number, centerY?: number) => void
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
    console.log('[PanZoom] Touch start with', e.touches.length, 'touches');
    
    // CRITICAL CHANGE: Only handle multi-touch gestures (2+ fingers)
    // Single touch (stylus or finger) is ignored for panning
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      // Initialize pinch-to-zoom
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
      
      // For 2-finger pan, use the center point
      if (e.touches.length === 2) {
        const center = getTouchCenter(e.touches);
        panHandlers.startPan(center.x, center.y);
      }
    }
    // Single touches are completely ignored - no panning initiated
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch move with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      // Pinch-to-zoom
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
        
        console.log('[PanZoom] Pinch zoom:', {
          factor: zoomFactor,
          center: { x: viewportCenterX, y: viewportCenterY },
          containerRect: { left: rect.left, top: rect.top }
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
    }
    // Single touches are ignored - no panning
  }, [getTouchDistance, getTouchCenter, zoom, panHandlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch end with', e.touches.length, 'remaining touches');
    
    // Reset gesture state when no touches remain
    if (e.touches.length === 0) {
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
    } else if (e.touches.length === 1) {
      // When going from multi-touch to single touch, stop gesture
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
      // Do NOT start single-touch panning here
    }
    // Continue multi-touch handling if still multiple touches
  }, [panHandlers]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
