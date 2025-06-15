
/**
 * @fileoverview Cache operations metrics tracking
 */

import { useCallback, useState } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

export const useCacheOperationsMetrics = () => {
  const [cacheOperations, setCacheOperations] = useState({
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalOperations: 0
  });

  /**
   * @function recordCacheOperation
   * @description Record cache hit or miss
   */
  const recordCacheOperation = useCallback((wasHit: boolean) => {
    setCacheOperations(prev => {
      const newHits = prev.hits + (wasHit ? 1 : 0);
      const newMisses = prev.misses + (wasHit ? 0 : 1);
      const totalOps = newHits + newMisses;
      const hitRate = totalOps > 0 ? (newHits / totalOps) * 100 : 0;

      debugLog('Metrics', 'Cache operation recorded', {
        wasHit,
        hitRate: `${hitRate.toFixed(1)}%`,
        totalOps
      });

      return {
        hits: newHits,
        misses: newMisses,
        hitRate,
        totalOperations: totalOps
      };
    });
  }, []);

  const resetCacheOperations = useCallback(() => {
    setCacheOperations({ hits: 0, misses: 0, hitRate: 0, totalOperations: 0 });
  }, []);

  return {
    cacheOperations,
    recordCacheOperation,
    resetCacheOperations
  };
};
