
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
    
    if (e.touches.length > 1) {
      panHandlers.setIsGestureActiveState(true);
      // Initialize pinch-to-zoom
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
    } else if (e.touches.length === 1) {
      // Single touch pan
      const touch = e.touches[0];
      panHandlers.startPan(touch.clientX, touch.clientY);
    }
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch move with', e.touches.length, 'touches');
    
    if (e.touches.length > 1) {
      // Pinch-to-zoom
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);
      
      const { lastDistance, lastCenter } = touchStateRef.current;
      
      if (lastDistance > 0) {
        const zoomFactor = currentDistance / lastDistance;
        zoom(zoomFactor, lastCenter.x, lastCenter.y);
      }
      
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = currentCenter;
    } else if (e.touches.length === 1) {
      // Single touch pan
      const touch = e.touches[0];
      panHandlers.continuePan(touch.clientX, touch.clientY);
    }
  }, [getTouchDistance, getTouchCenter, zoom, panHandlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch end with', e.touches.length, 'remaining touches');
    
    if (e.touches.length === 0) {
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.lastDistance = 0;
    } else if (e.touches.length === 1) {
      // Transition from multi-touch to single touch
      touchStateRef.current.lastDistance = 0;
      const touch = e.touches[0];
      panHandlers.startPan(touch.clientX, touch.clientY);
    }
  }, [panHandlers]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
