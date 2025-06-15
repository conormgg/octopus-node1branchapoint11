
/**
 * @fileoverview Layer optimization performance metrics tracking
 * @description Specialized metrics for layer caching and optimization performance
 */

import { useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { LayerOptimizationMetrics } from './layerOptimization/types';
import { useCacheOperationsMetrics } from './layerOptimization/useCacheOperationsMetrics';
import { useAdaptiveThresholdsMetrics } from './layerOptimization/useAdaptiveThresholdsMetrics';
import { useRenderPerformanceMetrics } from './layerOptimization/useRenderPerformanceMetrics';
import { useQualityMetrics } from './layerOptimization/useQualityMetrics';
import { useOptimizationRecommendations } from './layerOptimization/useOptimizationRecommendations';

const debugLog = createDebugLogger('layerOptimization');

/**
 * @hook useLayerOptimizationMetrics
 * @description Track and analyze layer optimization performance
 */
export const useLayerOptimizationMetrics = () => {
  const {
    cacheOperations,
    recordCacheOperation,
    resetCacheOperations
  } = useCacheOperationsMetrics();

  const {
    adaptiveThresholds,
    recordThresholdAdjustment,
    resetAdaptiveThresholds
  } = useAdaptiveThresholdsMetrics();

  const {
    renderPerformance,
    recordRenderPerformance,
    resetRenderPerformance
  } = useRenderPerformanceMetrics();

  const {
    qualityMetrics,
    recordQualityScore,
    resetQualityMetrics
  } = useQualityMetrics();

  const {
    getOptimizationRecommendations
  } = useOptimizationRecommendations();

  // Combined metrics object
  const metrics: LayerOptimizationMetrics = {
    cacheOperations,
    adaptiveThresholds,
    renderPerformance,
    qualityMetrics
  };

  // Get recommendations using current metrics
  const getRecommendations = useCallback(() => {
    return getOptimizationRecommendations(metrics);
  }, [getOptimizationRecommendations, metrics]);

  /**
   * @function resetMetrics
   * @description Reset all metrics (for testing or baseline establishment)
   */
  const resetMetrics = useCallback(() => {
    resetCacheOperations();
    resetAdaptiveThresholds();
    resetRenderPerformance();
    resetQualityMetrics();
    
    debugLog('Metrics', 'All metrics reset');
  }, [resetCacheOperations, resetAdaptiveThresholds, resetRenderPerformance, resetQualityMetrics]);

  return {
    metrics,
    recordCacheOperation,
    recordThresholdAdjustment,
    recordRenderPerformance,
    recordQualityScore,
    getOptimizationRecommendations: getRecommendations,
    resetMetrics
  };
};

// Export types for external use
export type { LayerOptimizationMetrics };
