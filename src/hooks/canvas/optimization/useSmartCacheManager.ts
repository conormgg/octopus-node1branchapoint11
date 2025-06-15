
import { useCallback, useRef, useMemo } from 'react';
import Konva from 'konva';
import { LayerCacheConfig, LayerCacheState } from './types';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

interface CachePerformanceMetrics {
  cacheHitRate: number;
  averageRenderTime: number;
  lastPerformanceCheck: number;
  consecutivePoorPerformance: number;
  adaptiveThreshold: number;
}

export const useSmartCacheManager = (
  layerRef: React.RefObject<Konva.Layer>,
  config: LayerCacheConfig,
  cacheState: React.MutableRefObject<LayerCacheState>
) => {
  const performanceMetrics = useRef<CachePerformanceMetrics>({
    cacheHitRate: 0,
    averageRenderTime: 0,
    lastPerformanceCheck: 0,
    consecutivePoorPerformance: 0,
    adaptiveThreshold: config.cacheThreshold
  });

  const contentHashRef = useRef<string>('');

  // Generate content hash for change detection
  const generateContentHash = useCallback((objectCount: number, layer: Konva.Layer): string => {
    if (!layer) return '';
    
    // Simple hash based on object count and basic properties
    const children = layer.children;
    let hash = `count:${objectCount}`;
    
    // Sample first few and last few objects for hash
    const sampleSize = Math.min(5, children.length);
    for (let i = 0; i < sampleSize; i++) {
      const child = children[i];
      if (child) {
        hash += `|${i}:${child.x()},${child.y()}`;
      }
    }
    
    return hash;
  }, []);

  // Check if content has actually changed
  const hasContentChanged = useCallback((objectCount: number): boolean => {
    if (!layerRef.current) return true;
    
    const newHash = generateContentHash(objectCount, layerRef.current);
    const changed = newHash !== contentHashRef.current;
    
    if (changed) {
      contentHashRef.current = newHash;
      debugLog('Phase2D3', 'Content change detected', { 
        oldHash: contentHashRef.current.slice(0, 20) + '...',
        newHash: newHash.slice(0, 20) + '...'
      });
    }
    
    return changed;
  }, [layerRef, generateContentHash]);

  // Smart threshold calculation based on performance
  const getAdaptiveThreshold = useCallback((): number => {
    const metrics = performanceMetrics.current;
    const baseThreshold = config.cacheThreshold;
    
    // Increase threshold if cache performance is poor
    if (metrics.cacheHitRate < 0.5 && metrics.consecutivePoorPerformance > 2) {
      metrics.adaptiveThreshold = Math.min(baseThreshold * 1.5, 50);
      debugLog('Phase2D3', 'Increased adaptive threshold due to poor performance', {
        newThreshold: metrics.adaptiveThreshold,
        hitRate: metrics.cacheHitRate
      });
    }
    // Decrease threshold if performance is excellent
    else if (metrics.cacheHitRate > 0.8 && metrics.averageRenderTime < 5) {
      metrics.adaptiveThreshold = Math.max(baseThreshold * 0.8, baseThreshold);
      debugLog('Phase2D3', 'Decreased adaptive threshold due to excellent performance', {
        newThreshold: metrics.adaptiveThreshold,
        hitRate: metrics.cacheHitRate
      });
    }
    
    return metrics.adaptiveThreshold;
  }, [config.cacheThreshold]);

  // Record cache performance
  const recordCachePerformance = useCallback((wasHit: boolean, renderTime: number) => {
    const metrics = performanceMetrics.current;
    const now = Date.now();
    
    // Update hit rate (exponential moving average)
    metrics.cacheHitRate = metrics.cacheHitRate * 0.9 + (wasHit ? 1 : 0) * 0.1;
    
    // Update average render time
    metrics.averageRenderTime = metrics.averageRenderTime * 0.9 + renderTime * 0.1;
    
    // Track consecutive poor performance
    if (renderTime > 10 || !wasHit) {
      metrics.consecutivePoorPerformance++;
    } else {
      metrics.consecutivePoorPerformance = 0;
    }
    
    metrics.lastPerformanceCheck = now;
    
    debugLog('Phase2D3', 'Cache performance recorded', {
      hitRate: metrics.cacheHitRate.toFixed(2),
      avgRenderTime: metrics.averageRenderTime.toFixed(1),
      consecutivePoor: metrics.consecutivePoorPerformance
    });
  }, []);

  // Smart cache decision
  const shouldCacheLayer = useCallback((objectCount: number): boolean => {
    if (!config.enableStaticCaching) return false;
    
    const adaptiveThreshold = getAdaptiveThreshold();
    const contentChanged = hasContentChanged(objectCount);
    const now = Date.now();
    const timeSinceCache = now - cacheState.current.lastCacheTime;
    
    // Don't cache if content hasn't changed and cache is recent
    if (!contentChanged && timeSinceCache < config.maxCacheAge / 2) {
      debugLog('Phase2D3', 'Skipping cache - no content change and recent cache');
      return false;
    }
    
    // Cache if we meet the adaptive threshold
    const shouldCache = objectCount >= adaptiveThreshold;
    
    debugLog('Phase2D3', 'Smart cache decision', {
      objectCount,
      adaptiveThreshold,
      contentChanged,
      timeSinceCache,
      shouldCache
    });
    
    return shouldCache;
  }, [config.enableStaticCaching, config.maxCacheAge, getAdaptiveThreshold, hasContentChanged, cacheState]);

  return {
    shouldCacheLayer,
    recordCachePerformance,
    getAdaptiveThreshold,
    hasContentChanged,
    getPerformanceMetrics: () => performanceMetrics.current
  };
};
