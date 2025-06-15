
/**
 * @fileoverview Drawing performance analysis
 * @description Analyzes drawing operations for optimization opportunities
 */

import { useCallback } from 'react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';
import { OptimizationOpportunity } from './types';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[DrawingAnalysis] ${action}`, data || '');
  }
};

/**
 * @hook useDrawingAnalysis
 * @description Analyzes drawing operations for performance issues
 */
export const useDrawingAnalysis = (dismissedOpportunities: Set<string>) => {
  const { metrics } = usePerformanceMonitor();

  const generateOpportunityId = useCallback((type: string, metric: string): string => {
    return `${type}_${metric}_${Date.now()}`;
  }, []);

  const analyze = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.drawingOperations.count === 0) return opportunities;

    // Slow drawing operations
    if (metrics.drawingOperations.averageTime > 16.67) {
      const id = generateOpportunityId('drawing', 'average_time');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'performance',
          severity: metrics.drawingOperations.averageTime > 33.33 ? 'high' : 'medium',
          title: 'Slow Drawing Operations',
          description: `Drawing operations are taking ${metrics.drawingOperations.averageTime.toFixed(2)}ms on average, which may cause frame drops.`,
          recommendation: 'Consider implementing line simplification, reducing point density, or using requestAnimationFrame for drawing operations.',
          impact: 'Improved drawing responsiveness and smoother user experience',
          detectedAt: Date.now(),
          metric: 'drawingOperations.averageTime',
          currentValue: metrics.drawingOperations.averageTime,
          targetValue: 16.67
        });
      }
    }

    // High frequency drawing operations
    if (metrics.drawingOperations.count > 1000 && metrics.drawingOperations.averageTime > 10) {
      const id = generateOpportunityId('drawing', 'high_frequency');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'performance',
          severity: 'medium',
          title: 'High Frequency Drawing Operations',
          description: 'Large number of drawing operations detected with moderate performance impact.',
          recommendation: 'Implement operation batching or throttling for drawing operations.',
          impact: 'Reduced CPU usage and improved overall performance',
          detectedAt: Date.now(),
          metric: 'drawingOperations.count',
          currentValue: metrics.drawingOperations.count,
          targetValue: 1000
        });
      }
    }

    debugLog('Analysis completed', {
      opportunitiesFound: opportunities.length,
      averageTime: metrics.drawingOperations.averageTime
    });

    return opportunities;
  }, [metrics.drawingOperations, generateOpportunityId, dismissedOpportunities]);

  return { analyze };
};
