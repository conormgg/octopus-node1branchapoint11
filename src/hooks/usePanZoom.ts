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
  zoomSpeed: 0.0006 // Increased from 0.0002 to make zoom more responsive
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

  const zoom = useCallback((delta: number, canvasX: number, canvasY: number) => {
    const newScale = Math.max(
      finalConfig.minScale,
      Math.min(finalConfig.maxScale, panZoomState.scale + delta)
    );

    if (newScale === panZoomState.scale) return;

    // Convert canvas coordinates to world coordinates
    const worldX = (canvasX - panZoomState.x) / panZoomState.scale;
    const worldY = (canvasY - panZoomState.y) / panZoomState.scale;

    // Calculate new pan position to keep the world point under the cursor
    const newX = canvasX - worldX * newScale;
    const newY = canvasY - worldY * newScale;

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
    
    // Get coordinates relative to the canvas container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    zoom(delta, canvasX, canvasY);
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
      
      // Get coordinates relative to the canvas container
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
      
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
      
      // Get coordinates relative to the canvas container
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const currentCenterX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      const currentCenterY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
      
      // Handle pinch zoom with proper zoom-to-center
      const scaleRatio = currentDistance / gestureStateRef.current.initialDistance;
      const newScale = Math.max(
        finalConfig.minScale,
        Math.min(finalConfig.maxScale, gestureStateRef.current.initialScale * scaleRatio)
      );
      
      // Convert initial pinch center to world coordinates using the initial state
      const initialPanState = {
        x: panZoomState.x - (currentCenterX - gestureStateRef.current.initialCenter.x),
        y: panZoomState.y - (currentCenterY - gestureStateRef.current.initialCenter.y)
      };
      
      const worldX = (gestureStateRef.current.initialCenter.x - initialPanState.x) / gestureStateRef.current.initialScale;
      const worldY = (gestureStateRef.current.initialCenter.y - initialPanState.y) / gestureStateRef.current.initialScale;
      
      // Calculate new pan position to keep the pinch center stationary
      const newX = currentCenterX - worldX * newScale;
      const newY = currentCenterY - worldY * newScale;
      
      setPanZoomState({
        x: newX,
        y: newY,
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
