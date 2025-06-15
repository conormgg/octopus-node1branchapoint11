
import React from 'react';
import { Tool } from '@/types/whiteboard';
import { useCanvasLayerOptimization } from '@/hooks/canvas/useCanvasLayerOptimization';
import Konva from 'konva';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');
const USE_LAYER_OPTIMIZATION = true; // Phase 2D.1: Enable layer optimization
const USE_SMART_CACHE_MANAGEMENT = true; // Phase 2D.3: Enable smart cache management

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
  // Layer optimization hook with Phase 2D.3 smart management
  const layerOptimization = useCanvasLayerOptimization(layerRef, {
    enableStaticCaching: USE_LAYER_OPTIMIZATION,
    cacheThreshold: 30, // Phase 2D.3: Base threshold (will be adaptive)
    maxCacheAge: 5000   // 5 second cache lifetime
  });

  // Phase 2D.3: Smart cache status logging
  if (USE_LAYER_OPTIMIZATION && USE_SMART_CACHE_MANAGEMENT) {
    const totalObjects = lineCount + imageCount;
    const adaptiveThreshold = layerOptimization.getAdaptiveThreshold();
    
    debugLog('Phase2D3', 'Smart cache management active', {
      totalObjects,
      baseThreshold: 30,
      adaptiveThreshold,
      willCache: totalObjects >= adaptiveThreshold
    });
  }

  // Phase 2D.3: Smart cache update with performance tracking
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && !isSelecting) {
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (!isActiveDrawing) {
        const totalObjects = lineCount + imageCount;
        
        if (USE_SMART_CACHE_MANAGEMENT) {
          // Phase 2D.3: Use smart cache decision
          const startTime = performance.now();
          
          if (layerOptimization.shouldCacheStaticLayer(totalObjects)) {
            debugLog('Phase2D3', 'Smart cache update recommended', {
              totalObjects,
              adaptiveThreshold: layerOptimization.getAdaptiveThreshold(),
              cacheQuality: layerOptimization.assessCacheQuality()
            });
            
            setTimeout(() => {
              layerOptimization.updateLayerOptimized();
              
              // Record performance
              const duration = performance.now() - startTime;
              layerOptimization.recordRenderTiming(duration);
              layerOptimization.recordCachePerformance(true, duration);
            }, 100);
          } else {
            // Record cache miss
            const duration = performance.now() - startTime;
            layerOptimization.recordCachePerformance(false, duration);
          }
        } else {
          // Fallback to Phase 2D.1 behavior
          if (totalObjects >= 30) {
            debugLog('Phase2D1', 'Considering layer cache update', {
              totalObjects,
              currentTool,
              isSelecting
            });
            
            setTimeout(() => {
              layerOptimization.updateLayerOptimized();
            }, 100);
          }
        }
      }
    }
  }, [
    lineCount, 
    imageCount, 
    isSelecting, 
    currentTool, 
    layerOptimization,
    USE_LAYER_OPTIMIZATION,
    USE_SMART_CACHE_MANAGEMENT
  ]);

  // Phase 2D.3: Smart cache disable during active operations
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION) {
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (isActiveDrawing || isSelecting) {
        debugLog('Phase2D3', 'Disabling cache during active operations', {
          isActiveDrawing,
          isSelecting,
          cacheRecommendation: USE_SMART_CACHE_MANAGEMENT ? layerOptimization.getCacheRecommendation() : 'N/A'
        });
        layerOptimization.disableStaticLayerCache();
      }
    }
  }, [currentTool, isSelecting, layerOptimization, USE_LAYER_OPTIMIZATION, USE_SMART_CACHE_MANAGEMENT]);

  // This component only handles optimization effects, no rendering
  return null;
};

export default LayerOptimizationHandler;
