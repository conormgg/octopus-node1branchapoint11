
import { useCallback, useRef, useState } from 'react';

export const usePanState = (
  panZoomState: any,
  setPanZoomState: (state: any) => void
) => {
  // Track gesture state more precisely
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  
  // Track pan state
  const panStateRef = useRef<{
    isPanning: boolean;
    lastX: number;
    lastY: number;
    startTime: number;
  }>({
    isPanning: false,
    lastX: 0,
    lastY: 0,
    startTime: 0
  });

  const startPan = useCallback((x: number, y: number) => {
    console.log('[PanZoom] Starting pan at:', { x, y });
    panStateRef.current = {
      isPanning: true,
      lastX: x,
      lastY: y,
      startTime: Date.now()
    };
    setIsGestureActiveState(true);
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    const { isPanning, lastX, lastY } = panStateRef.current;
    if (!isPanning) {
      console.log('[PanZoom] Continue pan called but not panning');
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
    setIsGestureActiveState(false);
  }, []);

  // FIX: Only return true for actual multi-touch gestures or active panning
  const isGestureActive = useCallback(() => {
    const actuallyActive = panStateRef.current.isPanning && isGestureActiveState;
    if (actuallyActive) {
      console.log('[PanZoom] Gesture is actually active');
    }
    return actuallyActive;
  }, [isGestureActiveState]);

  return {
    startPan,
    continuePan,
    stopPan,
    isGestureActive,
    setIsGestureActiveState
  };
};
