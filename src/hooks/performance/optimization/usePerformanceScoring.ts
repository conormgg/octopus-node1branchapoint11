
/**
 * @fileoverview Performance scoring and summary
 * @description Calculates performance scores and generates summaries
 */

import { useCallback } from 'react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';
import { OptimizationOpportunity, OptimizationSummary } from './types';

/**
 * @hook usePerformanceScoring
 * @description Calculates performance scores and generates summaries
 */
export const usePerformanceScoring = () => {
  const { metrics } = usePerformanceMonitor();

  const calculatePerformanceScore = useCallback((): number => {
    let score = 100;

    // Drawing performance (30% weight)
    if (metrics.drawingOperations.averageTime > 16.67) {
      score -= Math.min(30, (metrics.drawingOperations.averageTime - 16.67) * 2);
    }

    // Sync performance (25% weight)
    if (metrics.syncOperations.averageTime > 100) {
      score -= Math.min(25, (metrics.syncOperations.averageTime - 100) * 0.25);
    }

    // Render performance (35% weight)
    if (metrics.renderOperations.fps < 60) {
      score -= Math.min(35, (60 - metrics.renderOperations.fps) * 0.7);
    }

    // Memory usage (10% weight)
    const memoryUsageRatio = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;
    if (memoryUsageRatio > 0.7) {
      score -= Math.min(10, (memoryUsageRatio - 0.7) * 33.33);
    }

    return Math.max(0, Math.round(score));
  }, [metrics]);

  const generateSummary = useCallback((opportunities: OptimizationOpportunity[]): OptimizationSummary => {
    const summary: OptimizationSummary = {
      totalOpportunities: opportunities.length,
      criticalCount: opportunities.filter(opp => opp.severity === 'critical').length,
      highCount: opportunities.filter(opp => opp.severity === 'high').length,
      mediumCount: opportunities.filter(opp => opp.severity === 'medium').length,
      lowCount: opportunities.filter(opp => opp.severity === 'low').length,
      topRecommendations: opportunities
        .sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 3),
      performanceScore: calculatePerformanceScore()
    };

    return summary;
  }, [calculatePerformanceScore]);

  const getRecommendations = useCallback((
    opportunities: OptimizationOpportunity[],
    type?: OptimizationOpportunity['type'],
    severity?: OptimizationOpportunity['severity']
  ): OptimizationOpportunity[] => {
    return opportunities.filter(opp => 
      (!type || opp.type === type) && 
      (!severity || opp.severity === severity)
    );
  }, []);

  return {
    calculatePerformanceScore,
    generateSummary,
    getRecommendations
  };
};
