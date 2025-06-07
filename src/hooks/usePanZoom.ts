
import { useCallback } from 'react';
import { PanZoomState } from '@/types/whiteboard';

interface UsePanZoomProps {
  panZoomState: PanZoomState;
  setPanZoomState: (state: PanZoomState) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const usePanZoom = ({ 
  panZoomState, 
  setPanZoomState, 
  canvasWidth, 
  canvasHeight 
}: UsePanZoomProps) => {
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.1;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const direction = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + (direction * ZOOM_STEP);
    const newScale = Math.min(Math.max(panZoomState.scale * zoomFactor, MIN_ZOOM), MAX_ZOOM);
    
    if (newScale === panZoomState.scale) return;
    
    // Calculate new position to zoom towards mouse cursor
    const scaleChange = newScale / panZoomState.scale;
    const newX = mouseX - (mouseX - panZoomState.x) * scaleChange;
    const newY = mouseY - (mouseY - panZoomState.y) * scaleChange;
    
    setPanZoomState({
      x: newX,
      y: newY,
      scale: newScale
    });
  }, [panZoomState, setPanZoomState]);

  const handlePanStart = useCallback((e: MouseEvent) => {
    if (e.button !== 2) return false; // Only right mouse button
    e.preventDefault();
    return true;
  }, []);

  const handlePanMove = useCallback((e: MouseEvent, startPos: { x: number; y: number }) => {
    e.preventDefault();
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setPanZoomState({
      ...panZoomState,
      x: panZoomState.x + deltaX,
      y: panZoomState.y + deltaY
    });
    
    return { x: e.clientX, y: e.clientY };
  }, [panZoomState, setPanZoomState]);

  const resetView = useCallback(() => {
    setPanZoomState({
      x: 0,
      y: 0,
      scale: 1
    });
  }, [setPanZoomState]);

  const fitToScreen = useCallback(() => {
    const padding = 50;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;
    
    // Assume content size for fitting (this could be calculated from actual content)
    const contentWidth = 800;
    const contentHeight = 600;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const x = (canvasWidth - contentWidth * scale) / 2;
    const y = (canvasHeight - contentHeight * scale) / 2;
    
    setPanZoomState({ x, y, scale });
  }, [canvasWidth, canvasHeight, setPanZoomState]);

  return {
    handleWheel,
    handlePanStart,
    handlePanMove,
    resetView,
    fitToScreen,
    MIN_ZOOM,
    MAX_ZOOM
  };
};
