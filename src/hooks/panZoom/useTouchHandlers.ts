
import { useCallback, useRef } from 'react';

export const useTouchHandlers = (
  panHandlers: any,
  zoom: (factor: number, centerX?: number, centerY?: number) => void
) => {
  // Track touch state for pinch-to-zoom and gesture detection
  const touchStateRef = useRef<{
    lastDistance: number;
    lastCenter: { x: number; y: number };
    gestureMode: 'none' | 'pan' | 'zoom';
    initialDistance: number;
    distanceChangeThreshold: number;
  }>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    gestureMode: 'none',
    initialDistance: 0,
    distanceChangeThreshold: 20 // Minimum distance change to trigger zoom mode
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
    if (e.touches.length === 2) {
      panHandlers.setIsGestureActiveState(true);
      
      // Initialize gesture detection
      const initialDistance = getTouchDistance(e.touches);
      const initialCenter = getTouchCenter(e.touches);
      
      touchStateRef.current = {
        lastDistance: initialDistance,
        lastCenter: initialCenter,
        gestureMode: 'none', // Will be determined based on movement
        initialDistance: initialDistance,
        distanceChangeThreshold: 20
      };
      
      console.log('[PanZoom] Initialized 2-finger gesture detection');
    } else if (e.touches.length > 2) {
      // More than 2 fingers - just set gesture active but don't handle
      panHandlers.setIsGestureActiveState(true);
    }
    // Single touches are completely ignored - no panning initiated
  }, [getTouchDistance, getTouchCenter, panHandlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch move with', e.touches.length, 'touches');
    
    // Only handle exactly 2 fingers
    if (e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);
      const state = touchStateRef.current;
      
      // Determine gesture mode if not already set
      if (state.gestureMode === 'none') {
        const distanceChange = Math.abs(currentDistance - state.initialDistance);
        
        if (distanceChange > state.distanceChangeThreshold) {
          // Significant distance change - this is a zoom gesture
          state.gestureMode = 'zoom';
          console.log('[PanZoom] Detected ZOOM gesture');
        } else {
          // No significant distance change - this is a pan gesture
          state.gestureMode = 'pan';
          panHandlers.startPan(currentCenter.x, currentCenter.y);
          console.log('[PanZoom] Detected PAN gesture');
        }
      }
      
      // Execute the determined gesture
      if (state.gestureMode === 'zoom') {
        // Only do zoom, no panning
        if (state.lastDistance > 0) {
          const zoomFactor = currentDistance / state.lastDistance;
          zoom(zoomFactor, state.lastCenter.x, state.lastCenter.y);
        }
      } else if (state.gestureMode === 'pan') {
        // Only do panning, no zooming
        panHandlers.continuePan(currentCenter.x, currentCenter.y);
      }
      
      // Update state for next frame
      touchStateRef.current.lastDistance = currentDistance;
      touchStateRef.current.lastCenter = currentCenter;
    }
    // Single touches or more than 2 touches are ignored
  }, [getTouchDistance, getTouchCenter, zoom, panHandlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch end with', e.touches.length, 'remaining touches');
    
    // Reset gesture state when no touches remain
    if (e.touches.length === 0) {
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current = {
        lastDistance: 0,
        lastCenter: { x: 0, y: 0 },
        gestureMode: 'none',
        initialDistance: 0,
        distanceChangeThreshold: 20
      };
      console.log('[PanZoom] Reset all gesture state');
    } else if (e.touches.length === 1) {
      // When going from multi-touch to single touch, stop gesture
      panHandlers.setIsGestureActiveState(false);
      panHandlers.stopPan();
      touchStateRef.current.gestureMode = 'none';
      touchStateRef.current.lastDistance = 0;
      console.log('[PanZoom] Stopped gesture on single touch');
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
