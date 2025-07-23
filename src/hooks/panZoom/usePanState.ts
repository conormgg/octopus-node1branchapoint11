
import { useCallback, useRef, useState } from 'react';

export const usePanState = (
  panZoomState: any,
  setPanZoomState: (state: any) => void
) => {
  // Add gesture state tracking
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  
  // Use refs to avoid dependency issues
  const panZoomStateRef = useRef(panZoomState);
  const setPanZoomStateRef = useRef(setPanZoomState);
  
  // Update refs when props change
  panZoomStateRef.current = panZoomState;
  setPanZoomStateRef.current = setPanZoomState;
  
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
    // Prevent multiple startPan calls
    if (panStateRef.current.isPanning) {
      console.log('[PanZoom] Already panning, ignoring startPan');
      return;
    }
    
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

    const currentState = panZoomStateRef.current;
    setPanZoomStateRef.current({
      ...currentState,
      x: currentState.x + deltaX,
      y: currentState.y + deltaY
    });

    panStateRef.current.lastX = x;
    panStateRef.current.lastY = y;
  }, []); // No dependencies to prevent recreation

  const stopPan = useCallback(() => {
    // Prevent multiple stopPan calls
    if (!panStateRef.current.isPanning) {
      return;
    }
    
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
