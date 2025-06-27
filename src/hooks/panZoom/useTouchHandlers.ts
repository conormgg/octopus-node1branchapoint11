
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
    
    // Only handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      // Initialize both pan and zoom state
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
      
      // Start pan tracking at the center point
      const center = getTouchCenter(e.touches);
      panHandlers.startPan(center.x, center.y);
    }
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch move with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);
      
      const { lastDistance, lastCenter } = touchStateRef.current;
      
      if (lastDistance > 0) {
        // Calculate zoom factor
        const zoomFactor = currentDistance / lastDistance;
        
        // Calculate pan delta from center movement
        const panDeltaX = currentCenter.x - lastCenter.x;
        const panDeltaY = currentCenter.y - lastCenter.y;
        
        // Apply zoom at the current center position
        zoom(zoomFactor, currentCenter.x, currentCenter.y);
        
        // Apply pan delta by updating the last position for continuePan
        // We need to adjust the pan handlers' internal state to account for the center movement
        if (Math.abs(panDeltaX) > 1 || Math.abs(panDeltaY) > 1) {
          // Update the internal pan state to track the new center
          panHandlers.continuePan(currentCenter.x, currentCenter.y);
        }
      }
      
      // Update state for next iteration
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = currentCenter;
    }
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
    }
    // Continue multi-touch handling if still multiple touches
  }, [panHandlers]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
