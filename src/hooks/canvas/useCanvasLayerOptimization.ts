import { useMemo, useRef } from 'react';
import Konva from 'konva';
import { LayerCacheConfig, LayerCacheState } from './optimization/types';
import { useLayerCacheManager } from './optimization/useLayerCacheManager';
import { useLayerUpdater } from './optimization/useLayerUpdater';
import { usePerformanceMetrics } from './optimization/usePerformanceMetrics';
import { useSmartCacheManager } from './optimization/useSmartCacheManager';
import { useCacheQualityAssessment } from './optimization/useCacheQualityAssessment';

/**
 * Hook for optimizing canvas layer performance through smart caching
 * Phase 2D.3: Enhanced with intelligent cache management
 */
export const useCanvasLayerOptimization = (
  layerRef: React.RefObject<Konva.Layer>,
  config: LayerCacheConfig = {
    enableStaticCaching: true,
    cacheThreshold: 30, // Phase 2D.3: Will be adaptive
    maxCacheAge: 5000
  }
) => {
  const cacheState = useRef<LayerCacheState>({
    lastCacheTime: 0,
    staticObjectCount: 0,
    performanceMetrics: {
      cacheHits: 0,
      cacheMisses: 0,
      totalOptimizedUpdates: 0
    }
  });

  // Phase 2D.3: Smart cache management
  const smartCacheManager = useSmartCacheManager(layerRef, config, cacheState);
  const cacheQualityAssessment = useCacheQualityAssessment(layerRef);

  // Existing managers with smart integration
  const cacheManager = useLayerCacheManager(layerRef, config, cacheState);
  const layerUpdater = useLayerUpdater(
    layerRef, 
    cacheState, 
    smartCacheManager.shouldCacheLayer, // Phase 2D.3: Use smart cache decision
    cacheManager.enableStaticLayerCache
  );
  const performanceMetrics = usePerformanceMetrics(layerRef, cacheState);

  return useMemo(() => ({
    // Enhanced Phase 2D.3 API
    enableStaticLayerCache: cacheManager.enableStaticLayerCache,
    disableStaticLayerCache: cacheManager.disableStaticLayerCache,
    updateLayerOptimized: layerUpdater.updateLayerOptimized,
    shouldCacheStaticLayer: smartCacheManager.shouldCacheLayer, // Phase 2D.3: Smart decisions
    
    // Phase 2D.3: Smart cache management
    recordCachePerformance: smartCacheManager.recordCachePerformance,
    getAdaptiveThreshold: smartCacheManager.getAdaptiveThreshold,
    assessCacheQuality: cacheQualityAssessment.assessCacheQuality,
    getCacheRecommendation: cacheQualityAssessment.getCacheRecommendation,
    
    // Performance monitoring
    getPerformanceMetrics: performanceMetrics.getPerformanceMetrics,
    recordRenderTiming: cacheQualityAssessment.recordRenderTiming
  }), [
    cacheManager.enableStaticLayerCache,
    cacheManager.disableStaticLayerCache,
    layerUpdater.updateLayerOptimized,
    smartCacheManager.shouldCacheLayer,
    smartCacheManager.recordCachePerformance,
    smartCacheManager.getAdaptiveThreshold,
    cacheQualityAssessment.assessCacheQuality,
    cacheQualityAssessment.getCacheRecommendation,
    performanceMetrics.getPerformanceMetrics,
    cacheQualityAssessment.recordRenderTiming
  ]);
};
