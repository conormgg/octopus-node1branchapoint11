
import { useCallback, useMemo, useRef } from 'react';
import Konva from 'konva';

interface LayerCacheConfig {
  enableStaticCaching: boolean;
  cacheThreshold: number; // Number of objects before enabling cache
  maxCacheAge: number; // Max time in ms before cache refresh
}

/**
 * Hook for optimizing canvas layer performance through caching and selective updates
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

  // Check if static layer should be cached
  const shouldCacheStaticLayer = useCallback((objectCount: number) => {
    if (!config.enableStaticCaching) return false;
    
    const now = Date.now();
    const timeSinceCache = now - lastCacheTime.current;
    
    return (
      objectCount >= config.cacheThreshold &&
      (timeSinceCache > config.maxCacheAge || staticObjectCount.current !== objectCount)
    );
  }, [config.enableStaticCaching, config.cacheThreshold, config.maxCacheAge]);

  // Enable caching for static layer
  const enableStaticLayerCache = useCallback(() => {
    if (!layerRef.current) return;
    
    const layer = layerRef.current;
    const now = Date.now();
    
    // Enable layer caching for better performance with static content
    layer.cache();
    lastCacheTime.current = now;
    staticObjectCount.current = layer.children.length;
    
    console.log('[LayerOptimization] Static layer cache enabled', {
      objectCount: staticObjectCount.current,
      timestamp: now
    });
  }, [layerRef]);

  // Disable caching when dynamic content changes
  const disableStaticLayerCache = useCallback(() => {
    if (!layerRef.current) return;
    
    const layer = layerRef.current;
    layer.clearCache();
    lastCacheTime.current = 0;
    
    console.log('[LayerOptimization] Static layer cache disabled');
  }, [layerRef]);

  // Optimized layer update that minimizes redraws
  const updateLayerOptimized = useCallback((forceRedraw = false) => {
    if (!layerRef.current) return;
    
    const layer = layerRef.current;
    const objectCount = layer.children.length;
    
    // Use cache for static content when beneficial
    if (shouldCacheStaticLayer(objectCount)) {
      enableStaticLayerCache();
    }
    
    // Only redraw if necessary
    if (forceRedraw || !layer.isCached()) {
      layer.batchDraw();
    }
  }, [layerRef, shouldCacheStaticLayer, enableStaticLayerCache]);

  // Viewport-based culling for large numbers of objects
  const cullObjectsOutsideViewport = useCallback((viewport: { x: number; y: number; width: number; height: number; scale: number }) => {
    if (!layerRef.current) return;
    
    const layer = layerRef.current;
    const margin = 100; // Buffer zone around viewport
    
    layer.children.forEach(child => {
      const bounds = child.getClientRect();
      const isVisible = !(
        bounds.x + bounds.width < viewport.x - margin ||
        bounds.x > viewport.x + viewport.width + margin ||
        bounds.y + bounds.height < viewport.y - margin ||
        bounds.y > viewport.y + viewport.height + margin
      );
      
      // Only update visibility if it changed to prevent unnecessary redraws
      if (child.visible() !== isVisible) {
        child.visible(isVisible);
      }
    });
  }, [layerRef]);

  return useMemo(() => ({
    enableStaticLayerCache,
    disableStaticLayerCache,
    updateLayerOptimized,
    cullObjectsOutsideViewport,
    shouldCacheStaticLayer
  }), [enableStaticLayerCache, disableStaticLayerCache, updateLayerOptimized, cullObjectsOutsideViewport, shouldCacheStaticLayer]);
};
