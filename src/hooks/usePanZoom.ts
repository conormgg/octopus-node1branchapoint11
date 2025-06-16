
import { useCallback, useState } from 'react';
import { PanZoomState } from '@/types/whiteboard';

export const usePanZoom = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void
) => {
  // Add gesture state tracking
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);

  const startPan = useCallback((x: number, y: number) => {
    // Pan start logic - implementation depends on your existing pan system
    setIsGestureActiveState(true);
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    // Pan continue logic - implementation depends on your existing pan system
  }, []);

  const stopPan = useCallback(() => {
    // Pan stop logic - implementation depends on your existing pan system
    setIsGestureActiveState(false);
  }, []);

  const zoom = useCallback((factor: number, centerX?: number, centerY?: number) => {
    const newState: PanZoomState = {
      ...panZoomState,
      scale: Math.max(0.1, Math.min(5, panZoomState.scale * factor))
    };
    setPanZoomState(newState);
  }, [setPanZoomState, panZoomState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Wheel handling logic - implementation depends on your existing system
    e.preventDefault();
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Touch start logic - implementation depends on your existing system
    if (e.touches.length > 1) {
      setIsGestureActiveState(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Touch move logic - implementation depends on your existing system
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Touch end logic - implementation depends on your existing system
    if (e.touches.length === 0) {
      setIsGestureActiveState(false);
    }
  }, []);

  // Add the missing isGestureActive method
  const isGestureActive = useCallback(() => {
    return isGestureActiveState;
  }, [isGestureActiveState]);

  /**
   * Center the viewport on the given bounds
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
    
    // Calculate the translation needed to center the bounds in the viewport
    // We need to account for the current scale
    const scale = panZoomState.scale;
    
    const newPanX = viewportCenter.x - (boundsCenter.x * scale);
    const newPanY = viewportCenter.y - (boundsCenter.y * scale);
    
    console.log('[PanZoom] Calculated new position:', { 
      newPanX, 
      newPanY, 
      scale,
      boundsCenter,
      viewportCenter 
    });
    
    // Apply the new pan state with smooth animation
    const newState: PanZoomState = {
      ...panZoomState,
      x: newPanX,
      y: newPanY
    };
    setPanZoomState(newState);
  }, [panZoomState, setPanZoomState]);

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
