
/**
 * @fileoverview Quality metrics tracking
 */

import { useCallback, useRef, useState } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

export const useQualityMetrics = () => {
  const [qualityMetrics, setQualityMetrics] = useState({
    averageQualityScore: 0,
    lastQualityScore: 0,
    qualityTrend: 'stable' as 'improving' | 'stable' | 'declining',
    recommendationChanges: 0
  });

  const qualityHistory = useRef<number[]>([]);

  /**
   * @function recordQualityScore
   * @description Record cache quality assessment
   */
  const recordQualityScore = useCallback((qualityScore: number) => {
    qualityHistory.current.push(qualityScore);
    if (qualityHistory.current.length > 10) {
      qualityHistory.current.shift();
    }

    setQualityMetrics(prev => {
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
        averageQualityScore: averageScore,
        lastQualityScore: qualityScore,
        qualityTrend: trend,
        recommendationChanges: prev.recommendationChanges + (qualityScore !== prev.lastQualityScore ? 1 : 0)
      };
    });
  }, []);

  const resetQualityMetrics = useCallback(() => {
    setQualityMetrics({ 
      averageQualityScore: 0, 
      lastQualityScore: 0, 
      qualityTrend: 'stable', 
      recommendationChanges: 0 
    });
    qualityHistory.current = [];
  }, []);

  return {
    qualityMetrics,
    recordQualityScore,
    resetQualityMetrics
  };
};
