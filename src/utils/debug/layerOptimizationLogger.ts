
/**
 * @fileoverview Enhanced debug logging for layer optimization
 * @description Phase 2D.4 comprehensive logging for performance monitoring and tuning
 */

import { createDebugLogger } from './debugConfig';

const debugLog = createDebugLogger('layerOptimization');

/**
 * @interface PerformanceTrend
 * @description Performance trend analysis data
 */
interface PerformanceTrend {
  metric: string;
  values: number[];
  trend: 'improving' | 'stable' | 'declining';
  averageChange: number;
}

/**
 * @class LayerOptimizationLogger
 * @description Enhanced logging for layer optimization with trend analysis
 */
export class LayerOptimizationLogger {
  private performanceHistory: Map<string, number[]> = new Map();
  private thresholdHistory: number[] = [];
  private qualityHistory: number[] = [];
  private cacheHitHistory: boolean[] = [];

  /**
   * @method logCacheDecision
   * @description Log cache decision with performance context
   */
  logCacheDecision(
    objectCount: number,
    threshold: number,
    willCache: boolean,
    reason: string,
    performanceData?: {
      renderTime: number;
      qualityScore: number;
      hitRate: number;
    }
  ) {
    debugLog('Phase2D4', 'Cache decision made', {
      objectCount,
      threshold,
      willCache,
      reason,
      performance: performanceData ? {
        renderTime: `${performanceData.renderTime.toFixed(2)}ms`,
        qualityScore: performanceData.qualityScore.toFixed(2),
        hitRate: `${performanceData.hitRate.toFixed(1)}%`
      } : 'N/A'
    });

    // Track cache decisions for trend analysis
    this.cacheHitHistory.push(willCache);
    if (this.cacheHitHistory.length > 50) {
      this.cacheHitHistory.shift();
    }
  }

  /**
   * @method logThresholdAdjustment
   * @description Log adaptive threshold changes with reasoning
   */
  logThresholdAdjustment(
    oldThreshold: number,
    newThreshold: number,
    reason: string,
    performanceMetrics: {
      hitRate: number;
      avgRenderTime: number;
      consecutivePoorPerformance: number;
    }
  ) {
    const change = newThreshold - oldThreshold;
    const changePercent = (change / oldThreshold) * 100;

    debugLog('Phase2D4', 'Adaptive threshold adjusted', {
      oldThreshold,
      newThreshold,
      change: change > 0 ? `+${change}` : change.toString(),
      changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
      reason,
      metrics: {
        hitRate: `${performanceMetrics.hitRate.toFixed(1)}%`,
        avgRenderTime: `${performanceMetrics.avgRenderTime.toFixed(2)}ms`,
        consecutivePoorPerformance: performanceMetrics.consecutivePoorPerformance
      }
    });

    // Track threshold changes
    this.thresholdHistory.push(newThreshold);
    if (this.thresholdHistory.length > 20) {
      this.thresholdHistory.shift();
    }
  }

  /**
   * @method logPerformanceComparison
   * @description Log performance comparison between cached and uncached renders
   */
  logPerformanceComparison(
    cachedTime: number,
    uncachedTime: number,
    performanceGain: number,
    totalCachedRenders: number,
    totalUncachedRenders: number
  ) {
    debugLog('Phase2D4', 'Performance comparison updated', {
      cachedTime: `${cachedTime.toFixed(2)}ms`,
      uncachedTime: `${uncachedTime.toFixed(2)}ms`,
      performanceGain: `${performanceGain.toFixed(1)}%`,
      totalCachedRenders,
      totalUncachedRenders,
      sampleSize: totalCachedRenders + totalUncachedRenders
    });

    // Track performance metrics
    this.recordPerformanceMetric('cachedRenderTime', cachedTime);
    this.recordPerformanceMetric('uncachedRenderTime', uncachedTime);
    this.recordPerformanceMetric('performanceGain', performanceGain);
  }

  /**
   * @method logQualityAssessment
   * @description Log cache quality assessment with trend analysis
   */
  logQualityAssessment(
    qualityScore: number,
    components: {
      renderTimeBenefit: number;
      memoryEfficiency: number;
      updateFrequency: number;
    },
    recommendation: 'enable' | 'disable' | 'maintain'
  ) {
    debugLog('Phase2D4', 'Cache quality assessed', {
      qualityScore: qualityScore.toFixed(2),
      components: {
        renderBenefit: components.renderTimeBenefit.toFixed(2),
        memoryEff: components.memoryEfficiency.toFixed(2),
        updateFreq: components.updateFrequency.toFixed(2)
      },
      recommendation,
      trend: this.getQualityTrend()
    });

    // Track quality scores
    this.qualityHistory.push(qualityScore);
    if (this.qualityHistory.length > 15) {
      this.qualityHistory.shift();
    }
  }

  /**
   * @method logOptimizationEffectiveness
   * @description Log overall optimization effectiveness summary
   */
  logOptimizationEffectiveness(
    effectiveness: 'high' | 'medium' | 'low' | 'disabled',
    summary: {
      totalOperations: number;
      hitRate: number;
      avgPerformanceGain: number;
      thresholdStability: number;
      qualityTrend: string;
    }
  ) {
    debugLog('Phase2D4', 'Optimization effectiveness summary', {
      effectiveness,
      summary: {
        totalOps: summary.totalOperations,
        hitRate: `${summary.hitRate.toFixed(1)}%`,
        avgGain: `${summary.avgPerformanceGain.toFixed(1)}%`,
        thresholdStability: summary.thresholdStability.toFixed(2),
        qualityTrend: summary.qualityTrend
      },
      trends: this.generateTrendSummary()
    });
  }

  /**
   * @method logRecommendation
   * @description Log optimization recommendations with priority
   */
  logRecommendation(
    recommendation: string,
    priority: 'high' | 'medium' | 'low',
    impact: string,
    metrics: Record<string, number>
  ) {
    debugLog('Phase2D4', 'Optimization recommendation generated', {
      recommendation,
      priority,
      impact,
      supportingMetrics: Object.entries(metrics).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'number' ? value.toFixed(2) : value;
        return acc;
      }, {} as Record<string, string>)
    });
  }

  /**
   * @private
   * @method recordPerformanceMetric
   * @description Record performance metric for trend analysis
   */
  private recordPerformanceMetric(metric: string, value: number) {
    if (!this.performanceHistory.has(metric)) {
      this.performanceHistory.set(metric, []);
    }
    
    const history = this.performanceHistory.get(metric)!;
    history.push(value);
    
    if (history.length > 30) {
      history.shift();
    }
  }

  /**
   * @private
   * @method getQualityTrend
   * @description Calculate quality trend from recent scores
   */
  private getQualityTrend(): string {
    if (this.qualityHistory.length < 3) return 'insufficient-data';
    
    const recent = this.qualityHistory.slice(-3);
    const older = this.qualityHistory.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * @private
   * @method generateTrendSummary
   * @description Generate summary of all performance trends
   */
  private generateTrendSummary(): Record<string, string> {
    const trends: Record<string, string> = {};
    
    for (const [metric, values] of this.performanceHistory.entries()) {
      if (values.length >= 5) {
        const trend = this.calculateTrend(values);
        trends[metric] = trend.trend;
      }
    }
    
    return trends;
  }

  /**
   * @private
   * @method calculateTrend
   * @description Calculate trend direction for a metric
   */
  private calculateTrend(values: number[]): PerformanceTrend {
    if (values.length < 3) {
      return {
        metric: '',
        values,
        trend: 'stable',
        averageChange: 0
      };
    }
    
    const recentValues = values.slice(-3);
    const olderValues = values.slice(-6, -3);
    
    if (olderValues.length === 0) {
      return {
        metric: '',
        values,
        trend: 'stable',
        averageChange: 0
      };
    }
    
    const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
    
    const averageChange = recentAvg - olderAvg;
    const changePercent = Math.abs(averageChange / olderAvg);
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (changePercent > 0.1) {
      trend = averageChange > 0 ? 'improving' : 'declining';
    }
    
    return {
      metric: '',
      values,
      trend,
      averageChange
    };
  }
}

// Export singleton instance
export const layerOptimizationLogger = new LayerOptimizationLogger();
