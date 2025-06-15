
import { useCallback, useMemo, useRef } from 'react';
import Konva from 'konva';

interface LayerCacheConfig {
  enableStaticCaching: boolean;
  cacheThreshold: number; // Number of objects before enabling cache
  maxCacheAge: number; // Max time in ms before cache refresh
}

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[LayerOptimization:${context}] ${action}`, data || '');
  }
};

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
  const lastCacheTime = useRef<number>(0);
  const staticObjectCount = useRef<number>(0);
  const performanceMetrics = useRef({
    cacheHits: 0,
    cacheMisses: 0,
    totalOptimizedUpdates: 0
  });

  // Check if static layer should be cached
  const shouldCacheStaticLayer = useCallback((objectCount: number) => {
    if (!config.enableStaticCaching) {
      debugLog('Cache', 'Caching disabled by config');
      return false;
    }
    
    const now = Date.now();
    const timeSinceCache = now - lastCacheTime.current;
    const shouldCache = (
      objectCount >= config.cacheThreshold &&
      (timeSinceCache > config.maxCacheAge || staticObjectCount.current !== objectCount)
    );

    debugLog('Cache', 'Cache decision', {
      objectCount,
      threshold: config.cacheThreshold,
      timeSinceCache,
      maxAge: config.maxCacheAge,
      shouldCache
    });
    
    return shouldCache;
  }, [config.enableStaticCaching, config.cacheThreshold, config.maxCacheAge]);

  // Enable caching for static layer
  const enableStaticLayerCache = useCallback(() => {
    if (!layerRef.current) {
      debugLog('Cache', 'Cannot enable cache - no layer ref');
      return;
    }
    
    const layer = layerRef.current;
    const now = Date.now();
    
    try {
      // Enable layer caching for better performance with static content
      layer.cache();
      lastCacheTime.current = now;
      staticObjectCount.current = layer.children.length;
      performanceMetrics.current.totalOptimizedUpdates++;
      
      debugLog('Cache', 'Static layer cache enabled', {
        objectCount: staticObjectCount.current,
        timestamp: now,
        totalOptimizedUpdates: performanceMetrics.current.totalOptimizedUpdates
      });
    } catch (error) {
      debugLog('Cache', 'Failed to enable cache', { error: error.message });
    }
  }, [layerRef]);

  // Disable caching when dynamic content changes
  const disableStaticLayerCache = useCallback(() => {
    if (!layerRef.current) return;
    
    try {
      const layer = layerRef.current;
      layer.clearCache();
      lastCacheTime.current = 0;
      
      debugLog('Cache', 'Static layer cache disabled');
    } catch (error) {
      debugLog('Cache', 'Failed to disable cache', { error: error.message });
    }
  }, [layerRef]);

  // Optimized layer update that minimizes redraws
  const updateLayerOptimized = useCallback((forceRedraw = false) => {
    if (!layerRef.current) {
      debugLog('Update', 'Cannot update - no layer ref');
      return;
    }
    
    const layer = layerRef.current;
    const objectCount = layer.children.length;
    
    debugLog('Update', 'Optimized layer update', {
      objectCount,
      forceRedraw,
      isCached: layer.isCached()
    });
    
    // Use cache for static content when beneficial
    if (shouldCacheStaticLayer(objectCount)) {
      performanceMetrics.current.cacheHits++;
      enableStaticLayerCache();
    } else {
      performanceMetrics.current.cacheMisses++;
    }
    
    // Only redraw if necessary
    if (forceRedraw || !layer.isCached()) {
      layer.batchDraw();
      debugLog('Update', 'Layer redrawn', {
        reason: forceRedraw ? 'forced' : 'not cached'
      });
    } else {
      debugLog('Update', 'Skipped redraw - using cache');
    }
  }, [layerRef, shouldCacheStaticLayer, enableStaticLayerCache]);

  // Get performance metrics for monitoring
  const getPerformanceMetrics = useCallback(() => {
    return {
      ...performanceMetrics.current,
      isCached: layerRef.current?.isCached() || false,
      objectCount: layerRef.current?.children.length || 0,
      lastCacheTime: lastCacheTime.current
    };
  }, [layerRef]);

  return useMemo(() => ({
    enableStaticLayerCache,
    disableStaticLayerCache,
    updateLayerOptimized,
    shouldCacheStaticLayer,
    getPerformanceMetrics
  }), [
    enableStaticLayerCache, 
    disableStaticLayerCache, 
    updateLayerOptimized, 
    shouldCacheStaticLayer,
    getPerformanceMetrics
  ]);
};
