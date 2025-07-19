import { useCallback, useRef, useState, useMemo } from 'react';
import { PanZoomState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('panZoom');

export const usePanZoom = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void
) => {
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  const gestureStartTimeRef = useRef<number>(0);

  // Memoize the pan zoom state to prevent unnecessary re-renders
  const stablePanZoomState = useMemo(() => panZoomState, [panZoomState.x, panZoomState.y, panZoomState.scale]);

  const startPan = useCallback((x: number, y: number) => {
    debugLog('Pan', 'Starting pan', { x, y });
    isPanningRef.current = true;
    lastPanPointRef.current = { x, y };
    gestureStartTimeRef.current = Date.now();
    setIsGestureActiveState(true);
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    if (!isPanningRef.current) return;

    const deltaX = x - lastPanPointRef.current.x;
    const deltaY = y - lastPanPointRef.current.y;

    debugLog('Pan', 'Continuing pan', { x, y, deltaX, deltaY });

    setPanZoomState({
      ...stablePanZoomState,
      x: stablePanZoomState.x + deltaX,
      y: stablePanZoomState.y + deltaY
    });

    lastPanPointRef.current = { x, y };
  }, [stablePanZoomState, setPanZoomState]);

  const stopPan = useCallback(() => {
    if (isPanningRef.current) {
      debugLog('Pan', 'Stopping pan');
      isPanningRef.current = false;
      
      // Keep gesture active for a short time to prevent immediate drawing
      setTimeout(() => {
        setIsGestureActiveState(false);
      }, 100);
    }
  }, []);

  const zoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const scaleFactor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(5, stablePanZoomState.scale * scaleFactor));
    
    if (newScale === stablePanZoomState.scale) return;

    debugLog('Zoom', 'Zooming', { delta, newScale, centerX, centerY });

    const scaleChange = newScale / stablePanZoomState.scale;
    const newX = centerX - (centerX - stablePanZoomState.x) * scaleChange;
    const newY = centerY - (centerY - stablePanZoomState.y) * scaleChange;

    setPanZoomState({
      x: newX,
      y: newY,
      scale: newScale
    });
  }, [stablePanZoomState, setPanZoomState]);

  const centerOnBounds = useCallback((bounds: { x: number; y: number; width: number; height: number }, viewportWidth: number, viewportHeight: number) => {
    const padding = 50;
    const scaleX = (viewportWidth - padding * 2) / bounds.width;
    const scaleY = (viewportHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 2); // Cap at 2x zoom
    
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    const x = viewportWidth / 2 - centerX * scale;
    const y = viewportHeight / 2 - centerY * scale;
    
    debugLog('Center', 'Centering on bounds', { bounds, scale, x, y });
    
    setPanZoomState({ x, y, scale });
  }, [setPanZoomState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    setIsGestureActiveState(true);
    gestureStartTimeRef.current = Date.now();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    zoom(e.deltaY, centerX, centerY);
    
    // Reset gesture state after a short delay
    setTimeout(() => {
      setIsGestureActiveState(false);
    }, 100);
  }, [zoom]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length >= 2) {
      debugLog('Touch', 'Multi-touch start', { touches: e.touches.length });
      setIsGestureActiveState(true);
      gestureStartTimeRef.current = Date.now();
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length >= 2) {
      debugLog('Touch', 'Multi-touch move', { touches: e.touches.length });
      // Handle pinch zoom logic here
      setIsGestureActiveState(true);
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      debugLog('Touch', 'Multi-touch end', { touches: e.touches.length });
      // Keep gesture active for a short time to prevent immediate drawing
      setTimeout(() => {
        setIsGestureActiveState(false);
      }, 150);
    }
  }, []);

  // Only consider gesture active if it's a recent multi-touch or pan operation
  const isGestureActive = useCallback(() => {
    const now = Date.now();
    const timeSinceGestureStart = now - (gestureStartTimeRef.current || 0);
    
    // Don't block drawing if gesture was more than 200ms ago
    if (timeSinceGestureStart > 200) {
      return false;
    }
    
    return isGestureActiveState || isPanningRef.current;
  }, [isGestureActiveState]);

  return {
    startPan,
    continuePan,
    stopPan,
    zoom,
    centerOnBounds,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGestureActive
  };
};
