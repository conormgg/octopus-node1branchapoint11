
/**
 * @fileoverview Render performance metrics tracking
 */

import { useCallback, useState } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

export const useRenderPerformanceMetrics = () => {
  const [renderPerformance, setRenderPerformance] = useState({
    cachedRenderTime: 0,
    uncachedRenderTime: 0,
    performanceGain: 0,
    totalCachedRenders: 0,
    totalUncachedRenders: 0
  });

  /**
   * @function recordRenderPerformance
   * @description Record render performance data
   */
  const recordRenderPerformance = useCallback((renderTime: number, wasCached: boolean) => {
    setRenderPerformance(prev => {
      let newMetrics;
      
      if (wasCached) {
        const newCachedCount = prev.totalCachedRenders + 1;
        const newCachedTime = (prev.cachedRenderTime * (newCachedCount - 1) + renderTime) / newCachedCount;
        
        newMetrics = {
          ...prev,
          cachedRenderTime: newCachedTime,
          totalCachedRenders: newCachedCount
        };
      } else {
        const newUncachedCount = prev.totalUncachedRenders + 1;
        const newUncachedTime = (prev.uncachedRenderTime * (newUncachedCount - 1) + renderTime) / newUncachedCount;
        
        newMetrics = {
          ...prev,
          uncachedRenderTime: newUncachedTime,
          totalUncachedRenders: newUncachedCount
        };
      }

      // Calculate performance gain
      const performanceGain = newMetrics.uncachedRenderTime > 0 
        ? ((newMetrics.uncachedRenderTime - newMetrics.cachedRenderTime) / newMetrics.uncachedRenderTime) * 100
        : 0;

      newMetrics.performanceGain = Math.max(0, performanceGain);

      debugLog('Metrics', 'Render performance recorded', {
        renderTime: `${renderTime.toFixed(2)}ms`,
        wasCached,
        performanceGain: `${performanceGain.toFixed(1)}%`
      });

      return newMetrics;
    });
  }, []);

  const resetRenderPerformance = useCallback(() => {
    setRenderPerformance({ 
      cachedRenderTime: 0, 
      uncachedRenderTime: 0, 
      performanceGain: 0, 
      totalCachedRenders: 0, 
      totalUncachedRenders: 0 
    });
  }, []);

  return {
    renderPerformance,
    recordRenderPerformance,
    resetRenderPerformance
  };
};
