
import { useCallback } from 'react';
import Konva from 'konva';
import { LayerCacheState } from './types';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

export const useLayerUpdater = (
  layerRef: React.RefObject<Konva.Layer>,
  cacheState: React.MutableRefObject<LayerCacheState>,
  shouldCacheStaticLayer: (objectCount: number) => boolean,
  enableStaticLayerCache: () => void
) => {
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
      cacheState.current.performanceMetrics.cacheHits++;
      enableStaticLayerCache();
    } else {
      cacheState.current.performanceMetrics.cacheMisses++;
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
  }, [layerRef, shouldCacheStaticLayer, enableStaticLayerCache, cacheState]);

  return {
    updateLayerOptimized
  };
};
