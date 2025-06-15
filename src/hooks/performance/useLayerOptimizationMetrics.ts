
/**
 * @fileoverview Layer optimization performance metrics tracking
 * @description Specialized metrics for layer caching and optimization performance
 */

import { useCallback, useRef, useState } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

/**
 * @interface LayerOptimizationMetrics
 * @description Metrics for layer optimization performance
 */
export interface LayerOptimizationMetrics {
  cacheOperations: {
    hits: number;
    misses: number;
    hitRate: number;
    totalOperations: number;
  };
  adaptiveThresholds: {
    current: number;
    baseline: number;
    adjustmentCount: number;
    lastAdjustment: number;
  };
  renderPerformance: {
    cachedRenderTime: number;
    uncachedRenderTime: number;
    performanceGain: number;
    totalCachedRenders: number;
    totalUncachedRenders: number;
  };
  qualityMetrics: {
    averageQualityScore: number;
    lastQualityScore: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    recommendationChanges: number;
  };
}

/**
 * @hook useLayerOptimizationMetrics
 * @description Track and analyze layer optimization performance
 */
export const useLayerOptimizationMetrics = () => {
  const [metrics, setMetrics] = useState<LayerOptimizationMetrics>({
    cacheOperations: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalOperations: 0
    },
    adaptiveThresholds: {
      current: 30,
      baseline: 30,
      adjustmentCount: 0,
      lastAdjustment: 0
    },
    renderPerformance: {
      cachedRenderTime: 0,
      uncachedRenderTime: 0,
      performanceGain: 0,
      totalCachedRenders: 0,
      totalUncachedRenders: 0
    },
    qualityMetrics: {
      averageQualityScore: 0,
      lastQualityScore: 0,
      qualityTrend: 'stable',
      recommendationChanges: 0
    }
  });

  const qualityHistory = useRef<number[]>([]);

  /**
   * @function recordCacheOperation
   * @description Record cache hit or miss
   */
  const recordCacheOperation = useCallback((wasHit: boolean) => {
    setMetrics(prev => {
      const newHits = prev.cacheOperations.hits + (wasHit ? 1 : 0);
      const newMisses = prev.cacheOperations.misses + (wasHit ? 0 : 1);
      const totalOps = newHits + newMisses;
      const hitRate = totalOps > 0 ? (newHits / totalOps) * 100 : 0;

      debugLog('Metrics', 'Cache operation recorded', {
        wasHit,
        hitRate: `${hitRate.toFixed(1)}%`,
        totalOps
      });

      return {
        ...prev,
        cacheOperations: {
          hits: newHits,
          misses: newMisses,
          hitRate,
          totalOperations: totalOps
        }
      };
    });
  }, []);

  /**
   * @function recordThresholdAdjustment
   * @description Record adaptive threshold changes
   */
  const recordThresholdAdjustment = useCallback((newThreshold: number) => {
    setMetrics(prev => {
      debugLog('Metrics', 'Threshold adjustment recorded', {
        oldThreshold: prev.adaptiveThresholds.current,
        newThreshold,
        adjustmentCount: prev.adaptiveThresholds.adjustmentCount + 1
      });

      return {
        ...prev,
        adaptiveThresholds: {
          ...prev.adaptiveThresholds,
          current: newThreshold,
          adjustmentCount: prev.adaptiveThresholds.adjustmentCount + 1,
          lastAdjustment: Date.now()
        }
      };
    });
  }, []);

  /**
   * @function recordRenderPerformance
   * @description Record render performance data
   */
  const recordRenderPerformance = useCallback((renderTime: number, wasCached: boolean) => {
    setMetrics(prev => {
      let newMetrics;
      
      if (wasCached) {
        const newCachedCount = prev.renderPerformance.totalCachedRenders + 1;
        const newCachedTime = (prev.renderPerformance.cachedRenderTime * (newCachedCount - 1) + renderTime) / newCachedCount;
        
        newMetrics = {
          ...prev.renderPerformance,
          cachedRenderTime: newCachedTime,
          totalCachedRenders: newCachedCount
        };
      } else {
        const newUncachedCount = prev.renderPerformance.totalUncachedRenders + 1;
        const newUncachedTime = (prev.renderPerformance.uncachedRenderTime * (newUncachedCount - 1) + renderTime) / newUncachedCount;
        
        newMetrics = {
          ...prev.renderPerformance,
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

      return {
        ...prev,
        renderPerformance: newMetrics
      };
    });
  }, []);

  /**
   * @function recordQualityScore
   * @description Record cache quality assessment
   */
  const recordQualityScore = useCallback((qualityScore: number) => {
    qualityHistory.current.push(qualityScore);
    if (qualityHistory.current.length > 10) {
      qualityHistory.current.shift();
    }

    setMetrics(prev => {
      const history = qualityHistory.current;
      const averageScore = history.reduce((sum, score) => sum + score, 0) / history.length;
      
      // Determine trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (history.length >= 3) {
        const recent = history.slice(-3);
        const older = history.slice(-6, -3);
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
          const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
          
          if (recentAvg > olderAvg + 0.1) trend = 'improving';
          else if (recentAvg < olderAvg - 0.1) trend = 'declining';
        }
      }

      debugLog('Metrics', 'Quality score recorded', {
        qualityScore: qualityScore.toFixed(2),
        averageScore: averageScore.toFixed(2),
        trend
      });

      return {
        ...prev,
        qualityMetrics: {
          averageQualityScore: averageScore,
          lastQualityScore: qualityScore,
          qualityTrend: trend,
          recommendationChanges: prev.qualityMetrics.recommendationChanges + (qualityScore !== prev.qualityMetrics.lastQualityScore ? 1 : 0)
        }
      };
    });
  }, []);

  /**
   * @function getOptimizationRecommendations
   * @description Get performance-based optimization recommendations
   */
  const getOptimizationRecommendations = useCallback(() => {
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
  }, [metrics]);

  /**
   * @function resetMetrics
   * @description Reset all metrics (for testing or baseline establishment)
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      cacheOperations: { hits: 0, misses: 0, hitRate: 0, totalOperations: 0 },
      adaptiveThresholds: { current: 30, baseline: 30, adjustmentCount: 0, lastAdjustment: 0 },
      renderPerformance: { cachedRenderTime: 0, uncachedRenderTime: 0, performanceGain: 0, totalCachedRenders: 0, totalUncachedRenders: 0 },
      qualityMetrics: { averageQualityScore: 0, lastQualityScore: 0, qualityTrend: 'stable', recommendationChanges: 0 }
    });
    qualityHistory.current = [];
    
    debugLog('Metrics', 'All metrics reset');
  }, []);

  return {
    metrics,
    recordCacheOperation,
    recordThresholdAdjustment,
    recordRenderPerformance,
    recordQualityScore,
    getOptimizationRecommendations,
    resetMetrics
  };
};
