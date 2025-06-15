
/**
 * @fileoverview Types for layer optimization metrics
 */

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
