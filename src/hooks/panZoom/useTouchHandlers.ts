
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
    const containerCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
    
    // Convert to container-relative coordinates with scroll position
    let canvasCenter = { x: containerCenter.x, y: containerCenter.y };
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft || 0;
      const scrollTop = containerRef.current.scrollTop || 0;
      canvasCenter = {
        x: containerCenter.x - rect.left + scrollLeft,
        y: containerCenter.y - rect.top + scrollTop
      };
    }
    
    return { containerCenter, canvasCenter };
  }, [containerRef]);

  const applyZoomTransformation = useCallback((
    zoomFactor: number,
    zoomCenterX: number,
    zoomCenterY: number
  ) => {
    // Apply smoothing factor (0.3 = 30% of change per frame for responsive feel)
    const smoothFactor = 0.3;
    const targetScale = Math.max(0.1, Math.min(5, panZoomState.scale * zoomFactor));
    const newScale = panZoomState.scale + (targetScale - panZoomState.scale) * smoothFactor;
    
    // Calculate the world position of the zoom center before scaling
    const worldX = (zoomCenterX - panZoomState.x) / panZoomState.scale;
    const worldY = (zoomCenterY - panZoomState.y) / panZoomState.scale;
    
    // Calculate new pan position to keep the same world point under the zoom center
    const newX = zoomCenterX - (worldX * newScale);
    const newY = zoomCenterY - (worldY * newScale);
    
    return {
      ...panZoomState,
      scale: newScale,
      x: newX,
      y: newY
    };
  }, [panZoomState]);

  const applyPanAdjustment = useCallback((
    baseState: any,
    panDeltaX: number,
    panDeltaY: number
  ) => {
    return {
      ...baseState,
      x: baseState.x + panDeltaX,
      y: baseState.y + panDeltaY
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch start with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      
      const { containerCenter, canvasCenter } = getTouchCenter(e.touches);
      
      // Initialize touch state with both coordinate systems
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = containerCenter;
      touchStateRef.current.lastCanvasCenter = canvasCenter;
      
      // Start pan tracking at the canvas center point
      panHandlers.startPan(canvasCenter.x, canvasCenter.y);
    }
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch move with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      const currentDistance = getTouchDistance(e.touches);
      const { containerCenter, canvasCenter } = getTouchCenter(e.touches);
      
      const { lastDistance, lastCenter, lastCanvasCenter } = touchStateRef.current;
      
      if (lastDistance > 0) {
        // Calculate zoom factor with threshold to prevent micro-movements
        const zoomFactor = currentDistance / lastDistance;
        const zoomThreshold = 0.02;
        const shouldZoom = Math.abs(zoomFactor - 1) > zoomThreshold;
        
        // Calculate pan delta from canvas center movement
        const panDeltaX = canvasCenter.x - lastCanvasCenter.x;
        const panDeltaY = canvasCenter.y - lastCanvasCenter.y;
        const panThreshold = 2;
        const shouldPan = Math.abs(panDeltaX) > panThreshold || Math.abs(panDeltaY) > panThreshold;
        
        // Apply transformations separately for better control
        if (shouldZoom || shouldPan) {
          let newState = panZoomState;
          
          // Step 1: Apply zoom transformation using canvas coordinates
          if (shouldZoom) {
            newState = applyZoomTransformation(zoomFactor, canvasCenter.x, canvasCenter.y);
            console.log('[PanZoom] Applied zoom transformation:', {
              zoomFactor,
              center: canvasCenter,
              newScale: newState.scale
            });
          }
          
          // Step 2: Apply pan adjustment as a separate operation
          if (shouldPan) {
            newState = applyPanAdjustment(newState, panDeltaX, panDeltaY);
            console.log('[PanZoom] Applied pan adjustment:', {
              panDelta: { x: panDeltaX, y: panDeltaY }
            });
          }
          
          setPanZoomState(newState);
        }
      }
      
      // Update state for next iteration using both coordinate systems
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = containerCenter;
      touchStateRef.current.lastCanvasCenter = canvasCenter;
    }
  }, [getTouchDistance, getTouchCenter, applyZoomTransformation, applyPanAdjustment, setPanZoomState, panZoomState]);

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
