
import { useCallback, useRef } from 'react';
import { PanZoomState } from '@/types/whiteboard';

interface PanZoomConfig {
  minScale: number;
  maxScale: number;
  zoomSpeed: number;
}

const DEFAULT_CONFIG: PanZoomConfig = {
  minScale: 0.1,
  maxScale: 5,
  zoomSpeed: 0.001
};

export const usePanZoom = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void,
  config: Partial<PanZoomConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const gestureStateRef = useRef({
    isMultiTouch: false,
    initialDistance: 0,
    initialScale: 1,
    initialCenter: { x: 0, y: 0 }
  });

  const zoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const newScale = Math.max(
      finalConfig.minScale,
      Math.min(finalConfig.maxScale, panZoomState.scale + delta)
    );

    if (newScale === panZoomState.scale) return;

    // Calculate zoom center relative to current view
    const scaleRatio = newScale / panZoomState.scale;
    const newX = centerX - (centerX - panZoomState.x) * scaleRatio;
    const newY = centerY - (centerY - panZoomState.y) * scaleRatio;

    setPanZoomState({
      x: newX,
      y: newY,
      scale: newScale
    });
  }, [panZoomState, setPanZoomState, finalConfig]);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setPanZoomState({
      ...panZoomState,
      x: panZoomState.x + deltaX,
      y: panZoomState.y + deltaY
    });
  }, [panZoomState, setPanZoomState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * finalConfig.zoomSpeed;
    zoom(delta, e.clientX, e.clientY);
  }, [zoom, finalConfig.zoomSpeed]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    lastPanPointRef.current = { x: clientX, y: clientY };
  }, []);

  const continuePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return;

    const deltaX = clientX - lastPanPointRef.current.x;
    const deltaY = clientY - lastPanPointRef.current.y;
    
    pan(deltaX, deltaY);
    
    lastPanPointRef.current = { x: clientX, y: clientY };
  }, [pan]);

  const stopPan = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger gesture - prepare for pinch/pan
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      gestureStateRef.current = {
        isMultiTouch: true,
        initialDistance: distance,
        initialScale: panZoomState.scale,
        initialCenter: { x: centerX, y: centerY }
      };
      
      lastPanPointRef.current = { x: centerX, y: centerY };
    }
  }, [panZoomState.scale]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && gestureStateRef.current.isMultiTouch) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
      const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
      
      // Handle pinch zoom
      const scaleChange = (currentDistance / gestureStateRef.current.initialDistance) - 1;
      const newScale = Math.max(
        finalConfig.minScale,
        Math.min(finalConfig.maxScale, gestureStateRef.current.initialScale + scaleChange)
      );
      
      // Handle two-finger pan
      const deltaX = currentCenterX - lastPanPointRef.current.x;
      const deltaY = currentCenterY - lastPanPointRef.current.y;
      
      setPanZoomState({
        x: panZoomState.x + deltaX,
        y: panZoomState.y + deltaY,
        scale: newScale
      });
      
      lastPanPointRef.current = { x: currentCenterX, y: currentCenterY };
    }
  }, [panZoomState, setPanZoomState, finalConfig]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      gestureStateRef.current.isMultiTouch = false;
    }
  }, []);

  const resetView = useCallback(() => {
    setPanZoomState({ x: 0, y: 0, scale: 1 });
  }, [setPanZoomState]);

  const isGestureActive = useCallback(() => {
    return isPanningRef.current || gestureStateRef.current.isMultiTouch;
  }, []);

  return {
    handleWheel,
    startPan,
    continuePan,
    stopPan,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    isGestureActive,
    isPanning: isPanningRef.current,
    isMultiTouch: gestureStateRef.current.isMultiTouch
  };
};
