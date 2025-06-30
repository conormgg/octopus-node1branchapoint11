
import { useCallback } from 'react';
import { PanZoomState } from '@/types/whiteboard';

export const usePanZoomCore = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void
) => {
  const zoom = useCallback((factor: number, centerX?: number, centerY?: number) => {
    console.log('[PanZoomCore] Zooming with factor:', factor, 'center:', { centerX, centerY });
    
    const newScale = Math.max(0.1, Math.min(5, panZoomState.scale * factor));
    
    // If no center point provided, zoom from current viewport center
    const zoomCenterX = centerX ?? 0;
    const zoomCenterY = centerY ?? 0;
    
    // Calculate the world position of the zoom center before scaling
    // World position = (screen position - pan offset) / current scale
    const worldX = (zoomCenterX - panZoomState.x) / panZoomState.scale;
    const worldY = (zoomCenterY - panZoomState.y) / panZoomState.scale;
    
    // Calculate new pan position to keep the same world point under the cursor
    // New pan = screen position - (world position * new scale)
    const newX = zoomCenterX - (worldX * newScale);
    const newY = zoomCenterY - (worldY * newScale);

    console.log('[PanZoomCore] Zoom calculation:', {
      oldScale: panZoomState.scale,
      newScale,
      zoomCenter: { x: zoomCenterX, y: zoomCenterY },
      worldPos: { x: worldX, y: worldY },
      oldPan: { x: panZoomState.x, y: panZoomState.y },
      newPan: { x: newX, y: newY }
    });

    const newState: PanZoomState = {
      ...panZoomState,
      scale: newScale,
      x: newX,
      y: newY
    };
    setPanZoomState(newState);
  }, [setPanZoomState, panZoomState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    console.log('[PanZoomCore] Wheel event:', { deltaY: e.deltaY });
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    console.log('[PanZoomCore] Wheel zoom center:', { centerX, centerY });
    
    zoom(zoomFactor, centerX, centerY);
  }, [zoom]);

  /**
   * Center the viewport on the given bounds
   */
  const centerOnBounds = useCallback((
    bounds: { x: number; y: number; width: number; height: number },
    viewportWidth: number,
    viewportHeight: number
  ) => {
    console.log('[PanZoomCore] Centering on bounds:', bounds);
    
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
    
    console.log('[PanZoomCore] Calculated new position:', { 
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
    zoom,
    handleWheel,
    centerOnBounds
  };
};
