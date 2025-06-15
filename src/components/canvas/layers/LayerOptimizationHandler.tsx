
import React from 'react';
import { Tool } from '@/types/whiteboard';
import { useCanvasLayerOptimization } from '@/hooks/canvas/useCanvasLayerOptimization';
import Konva from 'konva';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
const USE_LAYER_OPTIMIZATION = false; // Feature flag - start disabled for safety

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[LayerOptimization:${context}] ${action}`, data || '');
  }
};

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
  // Layer optimization hook with conservative settings
  const layerOptimization = useCanvasLayerOptimization(layerRef, {
    enableStaticCaching: USE_LAYER_OPTIMIZATION,
    cacheThreshold: 20, // Only cache when 20+ objects
    maxCacheAge: 5000   // 5 second cache lifetime
  });

  // Log layer optimization status
  if (DEBUG_ENABLED && USE_LAYER_OPTIMIZATION) {
    debugLog('Optimization', 'Layer optimization enabled', {
      totalObjects: lineCount + imageCount,
      cacheThreshold: 20,
      willCache: lineCount + imageCount >= 20
    });
  }

  // Trigger layer optimization when static content changes
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && !isSelecting) {
      // Only optimize when not actively drawing or erasing
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (!isActiveDrawing) {
        const totalObjects = lineCount + imageCount;
        if (totalObjects >= 20) {
          debugLog('Optimization', 'Considering layer cache update', {
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
        debugLog('Optimization', 'Disabling cache during active drawing/selection');
        layerOptimization.disableStaticLayerCache();
      }
    }
  }, [currentTool, isSelecting, layerOptimization, USE_LAYER_OPTIMIZATION]);

  // This component only handles optimization effects, no rendering
  return null;
};

export default LayerOptimizationHandler;
