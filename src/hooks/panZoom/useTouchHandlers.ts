
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
    lastCanvasCenter: { x: number; y: number };
  }>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    lastCanvasCenter: { x: 0, y: 0 }
  });

  const combineTransformations = useCallback((
    zoomFactor: number,
    zoomCenterX: number,
    zoomCenterY: number,
    panDeltaX: number,
    panDeltaY: number
  ) => {
    const newScale = Math.max(0.1, Math.min(5, panZoomState.scale * zoomFactor));
    
    // Calculate zoom transformation
    const worldX = (zoomCenterX - panZoomState.x) / panZoomState.scale;
    const worldY = (zoomCenterY - panZoomState.y) / panZoomState.scale;
    
    const zoomNewX = zoomCenterX - (worldX * newScale);
    const zoomNewY = zoomCenterY - (worldY * newScale);
    
    // Combine zoom transformation with pan delta
    const finalX = zoomNewX + panDeltaX;
    const finalY = zoomNewY + panDeltaY;
    
    return {
      ...panZoomState,
      scale: newScale,
      x: finalX,
      y: finalY
    };
  }, [panZoomState]);

  const getTouchDistance = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: TouchList, useContainerCoords = false) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    let centerX = (touch1.clientX + touch2.clientX) / 2;
    let centerY = (touch1.clientY + touch2.clientY) / 2;
    
    // Convert to container-relative coordinates if needed
    if (useContainerCoords && containerRef?.current) {
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
      
      // Use container-relative coordinates for proper zoom centering
      const center = getTouchCenter(e.touches, true);
      
      // Initialize both pan and zoom state
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
      touchStateRef.current.lastCanvasCenter = center;
      
      // Start pan tracking at the center point
      panHandlers.startPan(center.x, center.y);
    }
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch move with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches, true);
      
      const { lastDistance, lastCanvasCenter } = touchStateRef.current;
      
      if (lastDistance > 0) {
        // Calculate zoom factor with threshold to prevent micro-movements
        const zoomFactor = currentDistance / lastDistance;
        const zoomThreshold = 0.02; // Only zoom if change is significant
        
        // Calculate pan delta from center movement
        const panDeltaX = currentCenter.x - lastCanvasCenter.x;
        const panDeltaY = currentCenter.y - lastCanvasCenter.y;
        const panThreshold = 2; // Minimum movement in pixels
        
        // Only update if there's meaningful change
        const shouldZoom = Math.abs(zoomFactor - 1) > zoomThreshold;
        const shouldPan = Math.abs(panDeltaX) > panThreshold || Math.abs(panDeltaY) > panThreshold;
        
        if (shouldZoom || shouldPan) {
          // Apply combined transformation in a single state update
          const newState = combineTransformations(
            shouldZoom ? zoomFactor : 1,
            currentCenter.x,
            currentCenter.y,
            shouldPan ? panDeltaX : 0,
            shouldPan ? panDeltaY : 0
          );
          
          console.log('[PanZoom] Applying combined transformation:', {
            zoomFactor: shouldZoom ? zoomFactor : 1,
            panDelta: { x: shouldPan ? panDeltaX : 0, y: shouldPan ? panDeltaY : 0 },
            center: currentCenter
          });
          
          setPanZoomState(newState);
        }
      }
      
      // Update state for next iteration
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
      touchStateRef.current.lastCanvasCenter = currentCenter;
    }
  }, [getTouchDistance, getTouchCenter, combineTransformations, setPanZoomState]);

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
