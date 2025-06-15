
import React from 'react';
import { Tool } from '@/types/whiteboard';
import { useCanvasLayerOptimization } from '@/hooks/canvas/useCanvasLayerOptimization';
import Konva from 'konva';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');
const USE_LAYER_OPTIMIZATION = true; // Phase 2D.1: Enable layer optimization

interface LayerOptimizationHandlerProps {
  layerRef: React.RefObject<Konva.Layer>;
  lineCount: number;
  imageCount: number;
  currentTool: Tool;
  isSelecting: boolean;
}

const LayerOptimizationHandler: React.FC<LayerOptimizationHandlerProps> = ({
  layerRef,
  lineCount,
  imageCount,
  currentTool,
  isSelecting
}) => {
  // Layer optimization hook with Phase 2D.1 settings
  const layerOptimization = useCanvasLayerOptimization(layerRef, {
    enableStaticCaching: USE_LAYER_OPTIMIZATION,
    cacheThreshold: 30, // Phase 2D.1: Conservative threshold - 30+ objects
    maxCacheAge: 5000   // 5 second cache lifetime
  });

  // Log layer optimization status for Phase 2D.1
  if (USE_LAYER_OPTIMIZATION) {
    debugLog('Phase2D1', 'Layer optimization active', {
      totalObjects: lineCount + imageCount,
      cacheThreshold: 30,
      willCache: lineCount + imageCount >= 30
    });
  }

  // Trigger layer optimization when static content changes
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && !isSelecting) {
      // Only optimize when not actively drawing or erasing
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (!isActiveDrawing) {
        const totalObjects = lineCount + imageCount;
        if (totalObjects >= 30) { // Phase 2D.1: Updated threshold
          debugLog('Phase2D1', 'Considering layer cache update', {
            totalObjects,
            currentTool,
            isSelecting
          });
          
          // Use optimized layer update after a brief delay to ensure rendering is complete
          setTimeout(() => {
            layerOptimization.updateLayerOptimized();
          }, 100);
        }
      }
    }
  }, [
    lineCount, 
    imageCount, 
    isSelecting, 
    currentTool, 
    layerOptimization,
    USE_LAYER_OPTIMIZATION
  ]);

  // Disable cache during active drawing for best responsiveness
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION) {
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (isActiveDrawing || isSelecting) {
        debugLog('Phase2D1', 'Disabling cache during active drawing/selection');
        layerOptimization.disableStaticLayerCache();
      }
    }
  }, [currentTool, isSelecting, layerOptimization, USE_LAYER_OPTIMIZATION]);

  // This component only handles optimization effects, no rendering
  return null;
};

export default LayerOptimizationHandler;
