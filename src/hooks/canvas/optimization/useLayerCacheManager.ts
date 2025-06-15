
import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LayerCacheConfig, LayerCacheState } from './types';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[LayerOptimization:${context}] ${action}`, data || '');
  }
};

export const useLayerCacheManager = (
  layerRef: React.RefObject<Konva.Layer>,
  config: LayerCacheConfig,
  cacheState: React.MutableRefObject<LayerCacheState>
) => {
  // Check if static layer should be cached
  const shouldCacheStaticLayer = useCallback((objectCount: number) => {
    if (!config.enableStaticCaching) {
      debugLog('Cache', 'Caching disabled by config');
      return false;
    }
    
    const now = Date.now();
    const timeSinceCache = now - cacheState.current.lastCacheTime;
    const shouldCache = (
      objectCount >= config.cacheThreshold &&
      (timeSinceCache > config.maxCacheAge || cacheState.current.staticObjectCount !== objectCount)
    );

    debugLog('Cache', 'Cache decision', {
      objectCount,
      threshold: config.cacheThreshold,
      timeSinceCache,
      maxAge: config.maxCacheAge,
      shouldCache
    });
    
    return shouldCache;
  }, [config.enableStaticCaching, config.cacheThreshold, config.maxCacheAge, cacheState]);

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
      cacheState.current.lastCacheTime = now;
      cacheState.current.staticObjectCount = layer.children.length;
      cacheState.current.performanceMetrics.totalOptimizedUpdates++;
      
      debugLog('Cache', 'Static layer cache enabled', {
        objectCount: cacheState.current.staticObjectCount,
        timestamp: now,
        totalOptimizedUpdates: cacheState.current.performanceMetrics.totalOptimizedUpdates
      });
    } catch (error) {
      debugLog('Cache', 'Failed to enable cache', { error: error.message });
    }
  }, [layerRef, cacheState]);

  // Disable caching when dynamic content changes
  const disableStaticLayerCache = useCallback(() => {
    if (!layerRef.current) return;
    
    try {
      const layer = layerRef.current;
      layer.clearCache();
      cacheState.current.lastCacheTime = 0;
      
      debugLog('Cache', 'Static layer cache disabled');
    } catch (error) {
      debugLog('Cache', 'Failed to disable cache', { error: error.message });
    }
  }, [layerRef, cacheState]);

  return {
    shouldCacheStaticLayer,
    enableStaticLayerCache,
    disableStaticLayerCache
  };
};
