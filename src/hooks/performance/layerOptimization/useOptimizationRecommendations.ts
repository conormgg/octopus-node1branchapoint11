
/**
 * @fileoverview Optimization recommendations logic
 */

import { useCallback } from 'react';
import { LayerOptimizationMetrics } from './types';

export const useOptimizationRecommendations = () => {
  /**
   * @function getOptimizationRecommendations
   * @description Get performance-based optimization recommendations
   */
  const getOptimizationRecommendations = useCallback((metrics: LayerOptimizationMetrics) => {
    const recommendations: string[] = [];
    
    if (metrics.cacheOperations.hitRate < 60 && metrics.cacheOperations.totalOperations > 10) {
      recommendations.push('Consider lowering cache threshold - low hit rate detected');
    }
    
    if (metrics.renderPerformance.performanceGain < 20 && metrics.renderPerformance.totalCachedRenders > 5) {
      recommendations.push('Cache performance gain is low - consider disabling for current workload');
    }
    
    if (metrics.qualityMetrics.qualityTrend === 'declining') {
      recommendations.push('Cache quality declining - consider cache strategy adjustment');
    }
    
    if (metrics.adaptiveThresholds.current > metrics.adaptiveThresholds.baseline * 1.5) {
      recommendations.push('Adaptive threshold significantly increased - workload may not benefit from caching');
    }

    return recommendations;
  }, []);

  return {
    getOptimizationRecommendations
  };
};
