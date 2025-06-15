
/**
 * @fileoverview Sync performance analysis
 * @description Analyzes sync operations for optimization opportunities
 */

import { useCallback } from 'react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';
import { OptimizationOpportunity } from './types';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[SyncAnalysis] ${action}`, data || '');
  }
};

/**
 * @hook useSyncAnalysis
 * @description Analyzes sync operations for performance issues
 */
export const useSyncAnalysis = (dismissedOpportunities: Set<string>) => {
  const { metrics } = usePerformanceMonitor();

  const generateOpportunityId = useCallback((type: string, metric: string): string => {
    return `${type}_${metric}_${Date.now()}`;
  }, []);

  const analyze = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.syncOperations.count === 0) return opportunities;

    // Slow sync operations
    if (metrics.syncOperations.averageTime > 100) {
      const id = generateOpportunityId('sync', 'average_time');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'network',
          severity: metrics.syncOperations.averageTime > 500 ? 'critical' : 'high',
          title: 'Slow Sync Operations',
          description: `Sync operations are taking ${metrics.syncOperations.averageTime.toFixed(2)}ms on average, which may cause collaboration delays.`,
          recommendation: 'Consider implementing operation batching, compression, or optimizing serialization.',
          impact: 'Improved real-time collaboration responsiveness',
          detectedAt: Date.now(),
          metric: 'syncOperations.averageTime',
          currentValue: metrics.syncOperations.averageTime,
          targetValue: 100
        });
      }
    }

    // High sync frequency
    if (metrics.syncOperations.count > 500 && metrics.syncOperations.averageTime > 50) {
      const id = generateOpportunityId('sync', 'high_frequency');
      if (!dismissedOpportunities.has(id)) {
        opportunities.push({
          id,
          type: 'network',
          severity: 'medium',
          title: 'High Frequency Sync Operations',
          description: 'High number of sync operations may be causing network congestion.',
          recommendation: 'Implement sync operation throttling or intelligent batching.',
          impact: 'Reduced network usage and improved sync efficiency',
          detectedAt: Date.now(),
          metric: 'syncOperations.count',
          currentValue: metrics.syncOperations.count,
          targetValue: 500
        });
      }
    }

    debugLog('Analysis completed', {
      opportunitiesFound: opportunities.length,
      averageTime: metrics.syncOperations.averageTime
    });

    return opportunities;
  }, [metrics.syncOperations, generateOpportunityId, dismissedOpportunities]);

  return { analyze };
};
