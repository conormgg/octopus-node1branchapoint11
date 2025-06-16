import { useCallback } from 'react';
import { PanZoomState } from '@/types/whiteboard';

export const usePanZoom = (
  panZoomState: PanZoomState,
  setPanZoomState: (state: PanZoomState) => void
) => {
  const startPan = useCallback((x: number, y: number) => {
    // Pan start logic - implementation depends on your existing pan system
  }, []);

  const continuePan = useCallback((x: number, y: number) => {
    // Pan continue logic - implementation depends on your existing pan system
  }, []);

  const stopPan = useCallback(() => {
    // Pan stop logic - implementation depends on your existing pan system
  }, []);

  const zoom = useCallback((factor: number, centerX?: number, centerY?: number) => {
    setPanZoomState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * factor))
    }));
  }, [setPanZoomState]);

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
    setPanZoomState(prev => ({
      ...prev,
      x: newPanX,
      y: newPanY
    }));
  }, [panZoomState.scale, setPanZoomState]);

  return {
    startPan,
    continuePan,
    stopPan,
    zoom,
    centerOnBounds
  };
};
