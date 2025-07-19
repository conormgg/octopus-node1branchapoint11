
import { useCallback, useRef, useState } from 'react';

export const usePanState = (
  panZoomState: any,
  setPanZoomState: (state: any) => void
) => {
  // FIXED: More precise gesture state tracking
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  
  // Track pan state with better precision
  const panStateRef = useRef<{
    isPanning: boolean;
    lastX: number;
    lastY: number;
    startTime: number;
    isMultiTouch: boolean;
  }>({
    isPanning: false,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    isMultiTouch: false
  });

  const startPan = useCallback((x: number, y: number, isMultiTouch: boolean = false) => {
    console.log('[PanZoom] Starting pan at:', { x, y, isMultiTouch });
    panStateRef.current = {
      isPanning: true,
      lastX: x,
      lastY: y,
      startTime: Date.now(),
      isMultiTouch
    };
    setIsGestureActiveState(true);
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    const { isPanning, lastX, lastY } = panStateRef.current;
    if (!isPanning) {
      return;
    }

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
    const wasActuallyPanning = panStateRef.current.isPanning;
    const panDuration = Date.now() - panStateRef.current.startTime;
    
    console.log('[PanZoom] Stopping pan - was actually panning:', wasActuallyPanning, 'duration:', panDuration);
    
    panStateRef.current.isPanning = false;
    panStateRef.current.isMultiTouch = false;
    setIsGestureActiveState(false);
  }, []);

  // CRITICAL FIX: Only return true for actual multi-touch gestures
  const isGestureActive = useCallback(() => {
    const actuallyActive = panStateRef.current.isPanning && panStateRef.current.isMultiTouch;
    if (actuallyActive) {
      console.log('[PanZoom] Multi-touch gesture is actually active');
    }
    return actuallyActive;
  }, []);

  return {
    startPan,
    continuePan,
    stopPan,
    isGestureActive,
    setIsGestureActiveState
  };
};
