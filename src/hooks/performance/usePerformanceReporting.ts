
/**
 * @fileoverview Performance report generation
 * @description Generates comprehensive performance reports with warnings and recommendations
 */

import { useCallback } from 'react';
import { PerformanceMetrics } from './usePerformanceMetrics';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @interface PerformanceReport
 * @description Comprehensive performance report structure
 */
export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  warnings: string[];
  recommendations: string[];
}

/**
 * @function debugLog
 * @description Report-specific debug logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[PerformanceReporting:${context}] ${action}`, data || '');
  }
};

/**
 * @hook usePerformanceReporting
 * @description Performance report generation with analysis and recommendations
 */
export const usePerformanceReporting = () => {
  /**
   * @function analyzeDrawingPerformance
   * @description Analyze drawing operation performance
   */
  const analyzeDrawingPerformance = useCallback((metrics: PerformanceMetrics, warnings: string[], recommendations: string[]) => {
    if (metrics.drawingOperations.averageTime > 16.67) {
      warnings.push('Drawing operations exceeding 60 FPS target');
      recommendations.push('Consider optimizing drawing algorithms or reducing point density');
    }

    if (metrics.drawingOperations.lastOperationTime > 33.33) {
      warnings.push('Recent drawing operation took longer than 30ms');
      recommendations.push('Check for performance bottlenecks in drawing pipeline');
    }
  }, []);

  /**
   * @function analyzeSyncPerformance
   * @description Analyze sync operation performance
   */
  const analyzeSyncPerformance = useCallback((metrics: PerformanceMetrics, warnings: string[], recommendations: string[]) => {
    if (metrics.syncOperations.averageTime > 100) {
      warnings.push('Sync operations taking longer than 100ms');
      recommendations.push('Consider batching sync operations or optimizing serialization');
    }

    if (metrics.syncOperations.lastSyncTime > 200) {
      warnings.push('Recent sync operation took longer than 200ms');
      recommendations.push('Check network conditions and server performance');
    }
  }, []);

  /**
   * @function analyzeRenderPerformance
   * @description Analyze render operation performance
   */
  const analyzeRenderPerformance = useCallback((metrics: PerformanceMetrics, warnings: string[], recommendations: string[]) => {
    if (metrics.renderOperations.fps < 50) {
      warnings.push('Frame rate below 50 FPS');
      recommendations.push('Consider reducing canvas complexity or implementing object culling');
    }

    if (metrics.renderOperations.averageTime > 16.67) {
      warnings.push('Render operations exceeding 60 FPS target');
      recommendations.push('Optimize rendering pipeline or reduce visual complexity');
    }
  }, []);

  /**
   * @function analyzeMemoryUsage
   * @description Analyze memory usage patterns
   */
  const analyzeMemoryUsage = useCallback((metrics: PerformanceMetrics, warnings: string[], recommendations: string[]) => {
    const memoryUsageRatio = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;
    
    if (memoryUsageRatio > 0.8) {
      warnings.push('High memory usage detected');
      recommendations.push('Consider implementing object pooling or memory cleanup');
    }

    if (memoryUsageRatio > 0.9) {
      warnings.push('Critical memory usage - near limit');
      recommendations.push('Immediate memory optimization required to prevent crashes');
    }
  }, []);

  /**
   * @function generateReport
   * @description Generate comprehensive performance report with warnings and recommendations
   */
  const generateReport = useCallback((metrics: PerformanceMetrics): PerformanceReport => {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze different performance aspects
    analyzeDrawingPerformance(metrics, warnings, recommendations);
    analyzeSyncPerformance(metrics, warnings, recommendations);
    analyzeRenderPerformance(metrics, warnings, recommendations);
    analyzeMemoryUsage(metrics, warnings, recommendations);

    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: { ...metrics },
      warnings,
      recommendations
    };

    debugLog('Report', 'Generated performance report', {
      warningsCount: warnings.length,
      recommendationsCount: recommendations.length,
      fps: metrics.renderOperations.fps,
      memoryUsage: `${((metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%`
    });

    return report;
  }, [analyzeDrawingPerformance, analyzeSyncPerformance, analyzeRenderPerformance, analyzeMemoryUsage]);

  return {
    generateReport
  };
};
