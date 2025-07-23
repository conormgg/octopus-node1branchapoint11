
import { useCallback, useRef, useState } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('panZoom');

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
    debugLog('PanState', 'Starting pan at:', { x, y });
    
    // Prevent multiple simultaneous pan operations
    if (panStateRef.current.isPanning) {
      debugLog('PanState', 'Pan already active, ignoring new start');
      return;
    }
    
    panStateRef.current = {
      isPanning: true,
      lastX: x,
      lastY: y
    };
    setIsGestureActiveState(true);
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    const { isPanning, lastX, lastY } = panStateRef.current;
    if (!isPanning) {
      debugLog('PanState', 'Not panning, ignoring continue');
      return;
    }

    const deltaX = x - lastX;
    const deltaY = y - lastY;

    debugLog('PanState', 'Continuing pan with delta:', { deltaX, deltaY, from: { lastX, lastY }, to: { x, y } });

    // Use functional setState to avoid stale closure issue
    setPanZoomState((currentState: any) => ({
      ...currentState,
      x: currentState.x + deltaX,
      y: currentState.y + deltaY
    }));

    panStateRef.current.lastX = x;
    panStateRef.current.lastY = y;
  }, [setPanZoomState]); // Remove panZoomState from dependencies to fix stale closure

  const stopPan = useCallback(() => {
    debugLog('PanState', 'Stopping pan');
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
