
import { useCallback } from 'react';
import Konva from 'konva';
import { LayerCacheState } from './types';

export const usePerformanceMetrics = (
  layerRef: React.RefObject<Konva.Layer>,
  cacheState: React.MutableRefObject<LayerCacheState>
) => {
  // Get performance metrics for monitoring
  const getPerformanceMetrics = useCallback(() => {
    return {
      ...cacheState.current.performanceMetrics,
      isCached: layerRef.current?.isCached() || false,
      objectCount: layerRef.current?.children.length || 0,
      lastCacheTime: cacheState.current.lastCacheTime
    };
  }, [layerRef, cacheState]);

  return {
    getPerformanceMetrics
  };
};
