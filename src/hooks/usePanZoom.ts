
import { useCallback, useState, useRef } from 'react';
import { PanZoomState } from '@/types/whiteboard';

export const usePanZoom = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void
) => {
  // Add gesture state tracking
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  
  // Track pan state
  const panStateRef = useRef<{
    isPanning: boolean;
    lastX: number;
    lastY: number;
  }>({
    isPanning: false,
    lastX: 0,
    lastY: 0
  });

  // Track touch state for pinch-to-zoom
  const touchStateRef = useRef<{
    lastDistance: number;
    lastCenter: { x: number; y: number };
  }>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 }
  });

  const startPan = useCallback((x: number, y: number) => {
    console.log('[PanZoom] Starting pan at:', { x, y });
    panStateRef.current = {
      isPanning: true,
      lastX: x,
      lastY: y
    };
    setIsGestureActiveState(true);
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    const { isPanning, lastX, lastY } = panStateRef.current;
    if (!isPanning) return;

    const deltaX = x - lastX;
    const deltaY = y - lastY;

    console.log('[PanZoom] Continuing pan with delta:', { deltaX, deltaY });

    setPanZoomState({
      ...panZoomState,
      x: panZoomState.x + deltaX,
      y: panZoomState.y + deltaY
    });

    panStateRef.current.lastX = x;
    panStateRef.current.lastY = y;
  }, [panZoomState, setPanZoomState]);

  const stopPan = useCallback(() => {
    console.log('[PanZoom] Stopping pan');
    panStateRef.current.isPanning = false;
    setIsGestureActiveState(false);
  }, []);

  const zoom = useCallback((factor: number, centerX?: number, centerY?: number) => {
    console.log('[PanZoom] Zooming with factor:', factor, 'center:', { centerX, centerY });
    
    const newScale = Math.max(0.1, Math.min(5, panZoomState.scale * factor));
    
    // If no center point provided, zoom from current viewport center
    const zoomCenterX = centerX ?? 0;
    const zoomCenterY = centerY ?? 0;
    
    // Calculate new pan position to keep zoom center fixed
    const scaleDelta = newScale - panZoomState.scale;
    const newX = panZoomState.x - (zoomCenterX * scaleDelta);
    const newY = panZoomState.y - (zoomCenterY * scaleDelta);

    const newState: PanZoomState = {
      ...panZoomState,
      scale: newScale,
      x: newX,
      y: newY
    };
    setPanZoomState(newState);
  }, [setPanZoomState, panZoomState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    console.log('[PanZoom] Wheel event:', { deltaY: e.deltaY });
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    zoom(zoomFactor, centerX, centerY);
  }, [zoom]);

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
      setIsGestureActiveState(true);
      // Initialize pinch-to-zoom
      touchStateRef.current.lastDistance = getTouchDistance(e.touches);
      touchStateRef.current.lastCenter = getTouchCenter(e.touches);
    } else if (e.touches.length === 1) {
      // Single touch pan
      const touch = e.touches[0];
      startPan(touch.clientX, touch.clientY);
    }
  }, [getTouchDistance, getTouchCenter, startPan]);

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
      continuePan(touch.clientX, touch.clientY);
    }
  }, [getTouchDistance, getTouchCenter, zoom, continuePan]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    console.log('[PanZoom] Touch end with', e.touches.length, 'remaining touches');
    
    if (e.touches.length === 0) {
      setIsGestureActiveState(false);
      stopPan();
      touchStateRef.current.lastDistance = 0;
    } else if (e.touches.length === 1) {
      // Transition from multi-touch to single touch
      touchStateRef.current.lastDistance = 0;
      const touch = e.touches[0];
      startPan(touch.clientX, touch.clientY);
    }
  }, [stopPan, startPan]);

  // Add the missing isGestureActive method
  const isGestureActive = useCallback(() => {
    return isGestureActiveState;
  }, [isGestureActiveState]);

  /**
   * Center the viewport on the given bounds
   * Fixed: Remove panZoomState dependency to prevent infinite loops
   */
  const centerOnBounds = useCallback((
    bounds: { x: number; y: number; width: number; height: number },
    viewportWidth: number,
    viewportHeight: number
  ) => {
    console.log('[PanZoom] Centering on bounds:', bounds);
    
    // Calculate the center point of the bounds
    const boundsCenter = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
    
    // Calculate the viewport center
    const viewportCenter = {
      x: viewportWidth / 2,
      y: viewportHeight / 2
    };
    
    // Use functional form to get current state and avoid dependency issues
    setPanZoomState((currentPanZoomState) => {
      // Calculate the translation needed to center the bounds in the viewport
      // We need to account for the current scale
      const scale = currentPanZoomState.scale;
      
      const newPanX = viewportCenter.x - (boundsCenter.x * scale);
      const newPanY = viewportCenter.y - (boundsCenter.y * scale);
      
      console.log('[PanZoom] Calculated new position:', { 
        newPanX, 
        newPanY, 
        scale,
        boundsCenter,
        viewportCenter 
      });
      
      // Apply the new pan state
      return {
        ...currentPanZoomState,
        x: newPanX,
        y: newPanY
      };
    });
  }, [setPanZoomState]);

  return {
    startPan,
    continuePan,
    stopPan,
    zoom,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGestureActive,
    centerOnBounds
  };
};
