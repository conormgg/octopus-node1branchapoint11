
import { useCallback, useRef, useState } from 'react';

export const usePanState = (
  panZoomState: any,
  setPanZoomState: (state: any) => void
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

    console.log('[PanZoom] Continuing pan with delta:', { deltaX, deltaY, from: { lastX, lastY }, to: { x, y } });

    setPanZoomState({
      ...panZoomState,
      x: panZoomState.x + deltaX,
      y: panZoomState.y + deltaY
    });

    // CRITICAL: Update the last position to prevent cumulative errors
    panStateRef.current.lastX = x;
    panStateRef.current.lastY = y;
  }, [panZoomState, setPanZoomState]);

  const stopPan = useCallback(() => {
    console.log('[PanZoom] Stopping pan');
    panStateRef.current.isPanning = false;
    setIsGestureActiveState(false);
  }, []);

  // Add the missing isGestureActive method
  const isGestureActive = useCallback(() => {
    return isGestureActiveState;
  }, [isGestureActiveState]);

  return {
    startPan,
    continuePan,
    stopPan,
    isGestureActive,
    setIsGestureActiveState
  };
};
