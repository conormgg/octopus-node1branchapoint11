
import React from 'react';
import { Tool } from '@/types/whiteboard';
import { useCanvasLayerOptimization } from '@/hooks/canvas/useCanvasLayerOptimization';
import { usePerformanceMonitorExtended } from '@/hooks/performance/usePerformanceMonitorExtended';
import Konva from 'konva';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');
const USE_LAYER_OPTIMIZATION = true; // Phase 2D.1: Enable layer optimization
const USE_SMART_CACHE_MANAGEMENT = true; // Phase 2D.3: Enable smart cache management
const USE_PERFORMANCE_INTEGRATION = true; // Phase 2D.4: Enable performance integration

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

  // Phase 2D.4: Extended performance monitoring integration
  const performanceMonitor = USE_PERFORMANCE_INTEGRATION 
    ? usePerformanceMonitorExtended()
    : null;

  // Phase 2D.4: Performance monitoring integration with threshold tracking
  React.useEffect(() => {
    if (USE_PERFORMANCE_INTEGRATION && performanceMonitor && USE_SMART_CACHE_MANAGEMENT) {
      const currentThreshold = layerOptimization.getAdaptiveThreshold();
      performanceMonitor.recordThresholdAdjustment(currentThreshold);
    }
  }, [layerOptimization, performanceMonitor, USE_PERFORMANCE_INTEGRATION, USE_SMART_CACHE_MANAGEMENT]);

  // Phase 2D.3: Smart cache status logging with Phase 2D.4 performance integration
  if (USE_LAYER_OPTIMIZATION && USE_SMART_CACHE_MANAGEMENT) {
    const totalObjects = lineCount + imageCount;
    const adaptiveThreshold = layerOptimization.getAdaptiveThreshold();
    
    debugLog('Phase2D4', 'Performance-integrated cache management active', {
      totalObjects,
      baseThreshold: 30,
      adaptiveThreshold,
      willCache: totalObjects >= adaptiveThreshold,
      performanceIntegration: USE_PERFORMANCE_INTEGRATION
    });
  }

  // Phase 2D.3: Smart cache update with Phase 2D.4 performance tracking
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION && !isSelecting) {
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (!isActiveDrawing) {
        const totalObjects = lineCount + imageCount;
        
        if (USE_SMART_CACHE_MANAGEMENT) {
          // Phase 2D.3: Use smart cache decision with Phase 2D.4 performance tracking
          const startTime = performance.now();
          
          if (layerOptimization.shouldCacheStaticLayer(totalObjects)) {
            debugLog('Phase2D4', 'Smart cache update with performance tracking', {
              totalObjects,
              adaptiveThreshold: layerOptimization.getAdaptiveThreshold(),
              cacheQuality: layerOptimization.assessCacheQuality(),
              performanceMonitoring: !!performanceMonitor
            });
            
            setTimeout(() => {
              layerOptimization.updateLayerOptimized();
              
              // Phase 2D.4: Enhanced performance recording
              const duration = performance.now() - startTime;
              layerOptimization.recordRenderTiming(duration);
              layerOptimization.recordCachePerformance(true, duration);
              
              // Phase 2D.4: Integrate with extended performance monitoring
              if (USE_PERFORMANCE_INTEGRATION && performanceMonitor) {
                performanceMonitor.recordLayerCacheOperation(true, duration);
                
                const qualityAssessment = layerOptimization.assessCacheQuality();
                performanceMonitor.recordLayerQualityAssessment(qualityAssessment.score);
                
                debugLog('Phase2D4', 'Performance data integrated', {
                  cacheHit: true,
                  duration: `${duration.toFixed(2)}ms`,
                  qualityScore: qualityAssessment.score.toFixed(2)
                });
              }
            }, 100);
          } else {
            // Phase 2D.4: Record cache miss with performance tracking
            const duration = performance.now() - startTime;
            layerOptimization.recordCachePerformance(false, duration);
            
            if (USE_PERFORMANCE_INTEGRATION && performanceMonitor) {
              performanceMonitor.recordLayerCacheOperation(false, duration);
              
              debugLog('Phase2D4', 'Cache miss recorded in performance system', {
                duration: `${duration.toFixed(2)}ms`
              });
            }
          }
        } else {
          // Fallback to Phase 2D.1 behavior with basic performance tracking
          if (totalObjects >= 30) {
            debugLog('Phase2D4', 'Basic cache update with performance tracking', {
              totalObjects,
              currentTool,
              isSelecting
            });
            
            const startTime = performance.now();
            setTimeout(() => {
              layerOptimization.updateLayerOptimized();
              
              if (USE_PERFORMANCE_INTEGRATION && performanceMonitor) {
                const duration = performance.now() - startTime;
                performanceMonitor.recordLayerCacheOperation(true, duration);
              }
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
    performanceMonitor,
    USE_LAYER_OPTIMIZATION,
    USE_SMART_CACHE_MANAGEMENT,
    USE_PERFORMANCE_INTEGRATION
  ]);

  // Phase 2D.3: Smart cache disable during active operations with Phase 2D.4 monitoring
  React.useEffect(() => {
    if (USE_LAYER_OPTIMIZATION) {
      const isActiveDrawing = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (isActiveDrawing || isSelecting) {
        debugLog('Phase2D4', 'Disabling cache during active operations with performance monitoring', {
          isActiveDrawing,
          isSelecting,
          cacheRecommendation: USE_SMART_CACHE_MANAGEMENT ? layerOptimization.getCacheRecommendation() : 'N/A',
          performanceRecommendations: USE_PERFORMANCE_INTEGRATION && performanceMonitor 
            ? performanceMonitor.getOptimizationRecommendations() 
            : []
        });
        layerOptimization.disableStaticLayerCache();
      }
    }
  }, [
    currentTool, 
    isSelecting, 
    layerOptimization, 
    performanceMonitor,
    USE_LAYER_OPTIMIZATION, 
    USE_SMART_CACHE_MANAGEMENT,
    USE_PERFORMANCE_INTEGRATION
  ]);

  // This component only handles optimization effects, no rendering
  return null;
};

export default LayerOptimizationHandler;
