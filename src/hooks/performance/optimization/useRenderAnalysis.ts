
/**
 * @fileoverview Render performance analysis
 * @description Analyzes render operations for optimization opportunities
 */

import { useCallback } from 'react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';
import { OptimizationOpportunity } from './types';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[RenderAnalysis] ${action}`, data || '');
  }
};

/**
 * @hook useRenderAnalysis
 * @description Analyzes render operations for performance issues
 */
export const useRenderAnalysis = (dismissedOpportunities: Set<string>) => {
  const { metrics } = usePerformanceMonitor();

  const generateOpportunityId = useCallback((type: string, metric: string): string => {
    return `${type}_${metric}_${Date.now()}`;
  }, []);

  const analyze = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.renderOperations.count === 0) return opportunities;

    // Low FPS
    if (metrics.renderOperations.fps < 50) {
      const id = generateOpportunityId('render', 'fps');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'rendering',
          severity: metrics.renderOperations.fps < 30 ? 'critical' : 'high',
          title: 'Low Frame Rate',
          description: `Frame rate is ${metrics.renderOperations.fps} FPS, below the target of 60 FPS.`,
          recommendation: 'Consider implementing object culling, reducing canvas complexity, or using virtualization for large numbers of objects.',
          impact: 'Smoother animations and better user experience',
          detectedAt: Date.now(),
          metric: 'renderOperations.fps',
          currentValue: metrics.renderOperations.fps,
          targetValue: 60
        });
      }
    }

    // Slow render operations
    if (metrics.renderOperations.averageTime > 16.67) {
      const id = generateOpportunityId('render', 'average_time');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'rendering',
          severity: 'medium',
          title: 'Slow Render Operations',
          description: `Render operations are taking ${metrics.renderOperations.averageTime.toFixed(2)}ms on average.`,
          recommendation: 'Optimize rendering pipeline, use caching for static objects, or implement dirty region rendering.',
          impact: 'Improved rendering performance and reduced CPU usage',
          detectedAt: Date.now(),
          metric: 'renderOperations.averageTime',
          currentValue: metrics.renderOperations.averageTime,
          targetValue: 16.67
        });
      }
    }

    debugLog('Analysis completed', {
      opportunitiesFound: opportunities.length,
      fps: metrics.renderOperations.fps
    });

    return opportunities;
  }, [metrics.renderOperations, generateOpportunityId, dismissedOpportunities]);

  return { analyze };
};
