
import { useMemo, useRef } from 'react';
import Konva from 'konva';
import { LayerCacheConfig, LayerCacheState } from './optimization/types';
import { useLayerCacheManager } from './optimization/useLayerCacheManager';
import { useLayerUpdater } from './optimization/useLayerUpdater';
import { usePerformanceMetrics } from './optimization/usePerformanceMetrics';

/**
 * Hook for optimizing canvas layer performance through caching
 */
export const useCanvasLayerOptimization = (
  layerRef: React.RefObject<Konva.Layer>,
  config: LayerCacheConfig = {
    enableStaticCaching: true,
    cacheThreshold: 10,
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

  const cacheManager = useLayerCacheManager(layerRef, config, cacheState);
  const layerUpdater = useLayerUpdater(
    layerRef, 
    cacheState, 
    cacheManager.shouldCacheStaticLayer, 
    cacheManager.enableStaticLayerCache
  );
  const performanceMetrics = usePerformanceMetrics(layerRef, cacheState);

  return useMemo(() => ({
    enableStaticLayerCache: cacheManager.enableStaticLayerCache,
    disableStaticLayerCache: cacheManager.disableStaticLayerCache,
    updateLayerOptimized: layerUpdater.updateLayerOptimized,
    shouldCacheStaticLayer: cacheManager.shouldCacheStaticLayer,
    getPerformanceMetrics: performanceMetrics.getPerformanceMetrics
  }), [
    cacheManager.enableStaticLayerCache,
    cacheManager.disableStaticLayerCache,
    layerUpdater.updateLayerOptimized,
    cacheManager.shouldCacheStaticLayer,
    performanceMetrics.getPerformanceMetrics
  ]);
};
