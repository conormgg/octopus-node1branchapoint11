
/**
 * @fileoverview Memory usage analysis
 * @description Analyzes memory usage for optimization opportunities
 */

import { useCallback } from 'react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';
import { OptimizationOpportunity } from './types';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[MemoryAnalysis] ${action}`, data || '');
  }
};

/**
 * @hook useMemoryAnalysis
 * @description Analyzes memory usage for optimization opportunities
 */
export const useMemoryAnalysis = (dismissedOpportunities: Set<string>) => {
  const { metrics } = usePerformanceMonitor();

  const generateOpportunityId = useCallback((type: string, metric: string): string => {
    return `${type}_${metric}_${Date.now()}`;
  }, []);

  const analyze = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.memoryUsage.jsHeapSizeLimit === 0) return opportunities;

    const memoryUsageRatio = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;

    // High memory usage
    if (memoryUsageRatio > 0.8) {
      const id = generateOpportunityId('memory', 'high_usage');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'memory',
          severity: memoryUsageRatio > 0.9 ? 'critical' : 'high',
          title: 'High Memory Usage',
          description: `Memory usage is at ${(memoryUsageRatio * 100).toFixed(1)}% of available heap.`,
          recommendation: 'Implement object pooling, cleanup unused objects, or consider implementing pagination for large whiteboards.',
          impact: 'Reduced memory pressure and improved stability',
          detectedAt: Date.now(),
          metric: 'memoryUsage.ratio',
          currentValue: memoryUsageRatio,
          targetValue: 0.7
        });
      }
    }

    debugLog('Analysis completed', {
      opportunitiesFound: opportunities.length,
      memoryUsageRatio: `${(memoryUsageRatio * 100).toFixed(1)}%`
    });

    return opportunities;
  }, [metrics.memoryUsage, generateOpportunityId, dismissedOpportunities]);

  return { analyze };
};
