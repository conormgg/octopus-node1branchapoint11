
import { useCallback, useRef } from 'react';

export const useTouchHandlers = (
  panHandlers: any,
  zoom: (factor: number, centerX?: number, centerY?: number) => void,
  panZoomState: any,
  setPanZoomState: (state: any) => void,
  containerRef?: React.RefObject<HTMLElement>
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
    let centerX = (touch1.clientX + touch2.clientX) / 2;
    let centerY = (touch1.clientY + touch2.clientY) / 2;
    
    // Convert to container-relative coordinates (same as mouse wheel)
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      centerX = centerX - rect.left;
      centerY = centerY - rect.top;
    }
    
    return { x: centerX, y: centerY };
  }, [containerRef]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch start with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      
      // Initialize touch state
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
        // Calculate zoom factor with threshold to prevent micro-movements
        const zoomFactor = currentDistance / lastDistance;
        const zoomThreshold = 0.02; // Only zoom if change is significant
        
        // Calculate pan delta from center movement
        const panDeltaX = currentCenter.x - lastCenter.x;
        const panDeltaY = currentCenter.y - lastCenter.y;
        const panThreshold = 2; // Minimum movement in pixels
        
        // Apply zoom using the same function as mouse wheel
        const shouldZoom = Math.abs(zoomFactor - 1) > zoomThreshold;
        if (shouldZoom) {
          console.log('[PanZoom] Applying zoom:', {
            zoomFactor,
            center: currentCenter
          });
          zoom(zoomFactor, currentCenter.x, currentCenter.y);
        }
        
        // Apply pan separately if needed
        const shouldPan = Math.abs(panDeltaX) > panThreshold || Math.abs(panDeltaY) > panThreshold;
        if (shouldPan) {
          console.log('[PanZoom] Applying pan delta:', { panDeltaX, panDeltaY });
          setPanZoomState((prevState: any) => ({
            ...prevState,
            x: prevState.x + panDeltaX,
            y: prevState.y + panDeltaY
          }));
        }
      }
      
      // Update state for next iteration
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = currentCenter;
    }
  }, [getTouchDistance, getTouchCenter, zoom, setPanZoomState]);

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
  }, [panHandlers]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
