
import { useCallback } from 'react';
import { PanZoomState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('panZoom');

export const usePanZoomCore = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void
) => {
  const zoom = useCallback((factor: number, centerX?: number, centerY?: number) => {
    debugLog('Zoom', 'Zooming with factor', { 
      factor, 
      center: { centerX, centerY },
      currentState: panZoomState
    });
    
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

    const newState: PanZoomState = {
      ...panZoomState,
      scale: newScale,
      x: newX,
      y: newY
    };

    debugLog('Zoom', 'New zoom state calculated', {
      oldState: panZoomState,
      newState,
      worldCoords: { x: worldX, y: worldY }
    });

    setPanZoomState(newState);
  }, [setPanZoomState, panZoomState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    debugLog('Wheel', 'Wheel event detected', { deltaY: e.deltaY });
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    debugLog('Wheel', 'Zoom parameters', {
      zoomFactor,
      center: { x: centerX, y: centerY },
      rect: { left: rect.left, top: rect.top }
    });
    
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
    debugLog('Center', 'Centering on bounds', { bounds, viewport: { width: viewportWidth, height: viewportHeight } });
    
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
    
    debugLog('Center', 'Calculated new position', { 
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
