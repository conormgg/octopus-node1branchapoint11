
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

  // Use the coordinate calculation hook
  const { getTouchCenter, getTouchDistance } = useContainerCoordinates({ 
    containerRef,
    includeScrollPosition: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch start with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures (2+ fingers)
    if (e.touches.length >= 2) {
      panHandlers.setIsGestureActiveState(true);
      
      // Get container rect for coordinate conversion
      const containerRect = containerRef?.current?.getBoundingClientRect();
      if (!containerRect) {
        console.warn('[TouchHandlers] Container rect not available');
        return;
      }
      
      const screenCenter = getTouchCenter(e.touches);
      const distance = getTouchDistance(e.touches);
      
      // Convert to container-relative coordinates (same as mouse wheel handler)
      const relativeCenter = {
        x: screenCenter.x - containerRect.left,
        y: screenCenter.y - containerRect.top
      };
      
      console.log('[TouchHandlers] Initializing touch gesture:', {
        screenCenter,
        relativeCenter,
        containerRect: { left: containerRect.left, top: containerRect.top },
        distance
      });
      
      // Initialize touch state with relative coordinates
      touchStateRef.current = {
        lastDistance: distance,
        lastCenter: relativeCenter,
        initialPanState: { x: panZoomState.x, y: panZoomState.y }
      };
      
      // Start pan tracking at the relative center point
      panHandlers.startPan(relativeCenter.x, relativeCenter.y);
    }
  }, [getTouchCenter, getTouchDistance, panHandlers, panZoomState, containerRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[TouchHandlers] Touch move with', e.touches.length, 'touches');
    
    // Only handle multi-touch gestures
    if (e.touches.length >= 2) {
      // Get container rect for coordinate conversion
      const containerRect = containerRef?.current?.getBoundingClientRect();
      if (!containerRect) {
        console.warn('[TouchHandlers] Container rect not available during move');
        return;
      }
      
      const screenCenter = getTouchCenter(e.touches);
      const currentDistance = getTouchDistance(e.touches);
      
      // Convert to container-relative coordinates (same as mouse wheel handler)
      const relativeCenter = {
        x: screenCenter.x - containerRect.left,
        y: screenCenter.y - containerRect.top
      };
      
      const { lastDistance, lastCenter } = touchStateRef.current;
      
      if (lastDistance > 0) {
        // Calculate zoom factor with threshold to prevent micro-movements
        const zoomFactor = currentDistance / lastDistance;
        const zoomThreshold = 0.02;
        
        // Calculate pan delta from center movement
        const panDeltaX = relativeCenter.x - lastCenter.x;
        const panDeltaY = relativeCenter.y - lastCenter.y;
        const panThreshold = 2;
        
        // Handle zoom using the same logic as mouse wheel
        const shouldZoom = Math.abs(zoomFactor - 1) > zoomThreshold;
        if (shouldZoom) {
          console.log('[TouchHandlers] Applying zoom:', {
            zoomFactor,
            center: relativeCenter
          });
          // Use the same zoom function as mouse wheel
          zoom(zoomFactor, relativeCenter.x, relativeCenter.y);
        }
        
        // Handle pan separately if center moved significantly
        const shouldPan = Math.abs(panDeltaX) > panThreshold || Math.abs(panDeltaY) > panThreshold;
        if (shouldPan) {
          console.log('[TouchHandlers] Applying pan:', {
            panDelta: { x: panDeltaX, y: panDeltaY }
          });
          // Apply pan using the pan handlers
          panHandlers.continuePan(relativeCenter.x, relativeCenter.y);
        }
      }
      
      // Update state for next iteration with relative coordinates
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = relativeCenter;
    }
  }, [getTouchCenter, getTouchDistance, zoom, panHandlers, containerRef]);

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
