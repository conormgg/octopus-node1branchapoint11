
/**
 * @fileoverview Extended performance monitor with layer optimization integration
 * @description Integrates layer optimization metrics with core performance monitoring
 */

import { useCallback } from 'react';
import { usePerformanceMonitor, PerformanceMetrics, PerformanceReport } from './usePerformanceMonitor';
import { useLayerOptimizationMetrics, LayerOptimizationMetrics } from './useLayerOptimizationMetrics';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

/**
 * @interface ExtendedPerformanceMetrics
 * @description Combined performance metrics including layer optimization
 */
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  layerOptimization: LayerOptimizationMetrics;
}

/**
 * @interface ExtendedPerformanceReport
 * @description Enhanced performance report with optimization insights
 */
export interface ExtendedPerformanceReport extends PerformanceReport {
  layerOptimization: {
    summary: string;
    recommendations: string[];
    effectiveness: 'high' | 'medium' | 'low' | 'disabled';
    cacheHitRate: number;
    performanceGain: number;
  };
}

/**
 * @hook usePerformanceMonitorExtended
 * @description Extended performance monitoring with layer optimization integration
 */
export const usePerformanceMonitorExtended = () => {
  debugLog('Hook', 'Initializing extended performance monitor');

  const coreMonitor = usePerformanceMonitor();
  const layerOptimization = useLayerOptimizationMetrics();

  /**
   * @function getExtendedMetrics
   * @description Get combined performance metrics
   */
  const getExtendedMetrics = useCallback((): ExtendedPerformanceMetrics => {
    return {
      ...coreMonitor.getMetrics(),
      layerOptimization: layerOptimization.metrics
    };
  }, [coreMonitor, layerOptimization.metrics]);

  /**
   * @function generateExtendedReport
   * @description Generate comprehensive performance report with optimization insights
   */
  const generateExtendedReport = useCallback((): ExtendedPerformanceReport => {
    const coreReport = coreMonitor.generateReport();
    const optimizationMetrics = layerOptimization.metrics;
    const recommendations = layerOptimization.getOptimizationRecommendations();

    // Determine optimization effectiveness
    let effectiveness: 'high' | 'medium' | 'low' | 'disabled' = 'disabled';
    
    if (optimizationMetrics.cacheOperations.totalOperations > 0) {
      if (optimizationMetrics.renderPerformance.performanceGain > 30) {
        effectiveness = 'high';
      } else if (optimizationMetrics.renderPerformance.performanceGain > 15) {
        effectiveness = 'medium';
      } else {
        effectiveness = 'low';
      }
    }

    // Generate summary
    const hitRate = optimizationMetrics.cacheOperations.hitRate;
    const performanceGain = optimizationMetrics.renderPerformance.performanceGain;
    
    let summary = '';
    if (effectiveness === 'disabled') {
      summary = 'Layer optimization is not currently active';
    } else {
      summary = `Layer optimization is ${effectiveness}ly effective with ${hitRate.toFixed(1)}% cache hit rate and ${performanceGain.toFixed(1)}% performance improvement`;
    }

    debugLog('Report', 'Extended performance report generated', {
      effectiveness,
      hitRate: `${hitRate.toFixed(1)}%`,
      performanceGain: `${performanceGain.toFixed(1)}%`,
      recommendationsCount: recommendations.length
    });

    return {
      ...coreReport,
      layerOptimization: {
        summary,
        recommendations,
        effectiveness,
        cacheHitRate: hitRate,
        performanceGain
      }
    };
  }, [coreMonitor, layerOptimization]);

  /**
   * @function recordLayerCacheOperation
   * @description Record layer cache operation with core performance tracking
   */
  const recordLayerCacheOperation = useCallback((wasHit: boolean, renderTime: number) => {
    // Record in layer optimization metrics
    layerOptimization.recordCacheOperation(wasHit);
    layerOptimization.recordRenderPerformance(renderTime, wasHit);
    
    // Also record in core render operations
    coreMonitor.recordRenderOperation(renderTime);
    
    debugLog('Integration', 'Layer cache operation recorded', {
      wasHit,
      renderTime: `${renderTime.toFixed(2)}ms`
    });
  }, [layerOptimization, coreMonitor]);

  /**
   * @function recordLayerQualityAssessment
   * @description Record layer cache quality assessment
   */
  const recordLayerQualityAssessment = useCallback((qualityScore: number) => {
    layerOptimization.recordQualityScore(qualityScore);
    
    debugLog('Integration', 'Layer quality assessment recorded', {
      qualityScore: qualityScore.toFixed(2)
    });
  }, [layerOptimization]);

  /**
   * @function recordThresholdAdjustment
   * @description Record adaptive threshold adjustment
   */
  const recordThresholdAdjustment = useCallback((newThreshold: number) => {
    layerOptimization.recordThresholdAdjustment(newThreshold);
    
    debugLog('Integration', 'Threshold adjustment recorded', { newThreshold });
  }, [layerOptimization]);

  return {
    // Core performance monitoring
    ...coreMonitor,
    
    // Extended functionality
    getExtendedMetrics,
    generateExtendedReport,
    
    // Layer optimization specific
    recordLayerCacheOperation,
    recordLayerQualityAssessment,
    recordThresholdAdjustment,
    
    // Layer optimization metrics access
    layerOptimizationMetrics: layerOptimization.metrics,
    getOptimizationRecommendations: layerOptimization.getOptimizationRecommendations,
    resetLayerMetrics: layerOptimization.resetMetrics
  };
};
