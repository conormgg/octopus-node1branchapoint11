
import { useCallback, useRef } from 'react';
import { useContainerCoordinates } from './useContainerCoordinates';

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
    initialPanState: { x: number; y: number };
  }>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    initialPanState: { x: 0, y: 0 }
  });

  // Use the proper coordinate calculation hook
  const { getTouchCenter, getTouchDistance } = useContainerCoordinates({ 
    containerRef,
    includeScrollPosition: true
  });

  const combineTransformations = useCallback((
    zoomFactor: number,
    zoomCenterX: number,
    zoomCenterY: number,
    panDeltaX: number,
    panDeltaY: number
  ) => {
    console.log('[TouchHandlers] Combining transformations:', {
      zoomFactor,
      zoomCenter: { x: zoomCenterX, y: zoomCenterY },
      panDelta: { x: panDeltaX, y: panDeltaY },
      currentState: panZoomState
    });

    const newScale = Math.max(0.1, Math.min(5, panZoomState.scale * zoomFactor));
    
    // Calculate zoom transformation with proper center point
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

  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch start with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      
      const { containerCenter } = getTouchCenter(e.touches);
      const distance = getTouchDistance(e.touches);
      
      console.log('[TouchHandlers] Initializing touch gesture:', {
        center: containerCenter,
        distance,
        currentPanZoom: panZoomState
      });
      
      // Initialize touch state
      touchStateRef.current = {
        lastDistance: distance,
        lastCenter: containerCenter,
        initialPanState: { x: panZoomState.x, y: panZoomState.y }
      };
      
      // Start pan tracking at the center point
      panHandlers.startPan(containerCenter.x, containerCenter.y);
    }
  }, [getTouchCenter, getTouchDistance, panHandlers, panZoomState]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch move with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      const { containerCenter } = getTouchCenter(e.touches);
      const currentDistance = getTouchDistance(e.touches);
      
      const { lastDistance, lastCenter } = touchStateRef.current;
      
      if (lastDistance > 0) {
        // Calculate zoom factor with threshold to prevent micro-movements
        const zoomFactor = currentDistance / lastDistance;
        const zoomThreshold = 0.015; // Reduced threshold for better responsiveness
        
        // Calculate pan delta from center movement
        const panDeltaX = containerCenter.x - lastCenter.x;
        const panDeltaY = containerCenter.y - lastCenter.y;
        const panThreshold = 1; // Reduced threshold for better panning
        
        // Only update if there's meaningful change
        const shouldZoom = Math.abs(zoomFactor - 1) > zoomThreshold;
        const shouldPan = Math.abs(panDeltaX) > panThreshold || Math.abs(panDeltaY) > panThreshold;
        
        if (shouldZoom || shouldPan) {
          console.log('[TouchHandlers] Applying transformation:', {
            shouldZoom,
            shouldPan,
            zoomFactor: shouldZoom ? zoomFactor : 1,
            panDelta: { x: shouldPan ? panDeltaX : 0, y: shouldPan ? panDeltaY : 0 },
            center: containerCenter
          });

          // Apply combined transformation in a single state update
          const newState = combineTransformations(
            shouldZoom ? zoomFactor : 1,
            containerCenter.x,
            containerCenter.y,
            shouldPan ? panDeltaX : 0,
            shouldPan ? panDeltaY : 0
          );
          
          setPanZoomState(newState);
        }
      }
      
      // Update state for next iteration
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = containerCenter;
    }
  }, [getTouchCenter, getTouchDistance, combineTransformations, setPanZoomState]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch end with', e.touches.length, 'remaining touches');
    
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
