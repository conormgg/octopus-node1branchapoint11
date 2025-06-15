/**
 * @fileoverview Optimization tracking and recommendations
 * @description Tracks optimization opportunities and provides actionable recommendations
 * for improving whiteboard performance based on usage patterns and metrics.
 * 
 * @ai-context This hook analyzes performance patterns and provides specific
 * optimization recommendations based on actual usage data and performance metrics.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Optimization tracking debug logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[OptimizationTracker:${context}] ${action}`, data || '');
  }
};

/**
 * @interface OptimizationOpportunity
 * @description Structure for tracking optimization opportunities
 */
export interface OptimizationOpportunity {
  id: string;
  type: 'performance' | 'memory' | 'network' | 'rendering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  detectedAt: number;
  metric?: string;
  currentValue?: number;
  targetValue?: number;
}

/**
 * @interface OptimizationSummary
 * @description Summary of current optimization state
 */
export interface OptimizationSummary {
  totalOpportunities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  topRecommendations: OptimizationOpportunity[];
  performanceScore: number;
}

/**
 * @hook useOptimizationTracker
 * @description Tracks and analyzes optimization opportunities for whiteboard performance
 * 
 * @returns {Object} Optimization tracking interface
 * @returns {OptimizationOpportunity[]} opportunities - Current optimization opportunities
 * @returns {Function} analyzePerformance - Analyze current performance for opportunities
 * @returns {Function} dismissOpportunity - Dismiss an optimization opportunity
 * @returns {Function} getSummary - Get optimization summary
 * @returns {Function} getRecommendations - Get specific recommendations
 * @returns {number} performanceScore - Overall performance score (0-100)
 * 
 * @ai-understanding
 * This tracker:
 * 1. Analyzes performance metrics to identify bottlenecks
 * 2. Provides specific, actionable optimization recommendations
 * 3. Tracks optimization opportunities by severity
 * 4. Calculates an overall performance score
 * 5. Can dismiss false positives or implemented optimizations
 */
export const useOptimizationTracker = () => {
  debugLog('Hook', 'Initializing optimization tracker');

  const { metrics } = usePerformanceMonitor();
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([]);
  const dismissedOpportunitiesRef = useRef<Set<string>>(new Set());
  const lastAnalysisRef = useRef<number>(0);

  /**
   * @function generateOpportunityId
   * @description Generate unique opportunity ID
   * @param type - Opportunity type
   * @param metric - Related metric
   * @returns Unique opportunity identifier
   * 
   * @ai-context Creates stable IDs for optimization opportunities
   * to prevent duplicate recommendations and allow dismissal tracking.
   */
  const generateOpportunityId = useCallback((type: string, metric: string): string => {
    return `${type}_${metric}_${Date.now()}`;
  }, []);

  /**
   * @function calculatePerformanceScore
   * @description Calculate overall performance score based on metrics
   * @returns Performance score from 0-100
   * 
   * @ai-context Provides a single metric for overall performance health
   * based on weighted analysis of drawing, sync, and render performance.
   */
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

  /**
   * @function analyzeDrawingPerformance
   * @description Analyze drawing operations for optimization opportunities
   * @returns Array of drawing-related optimization opportunities
   * 
   * @ai-context Identifies specific issues with drawing performance
   * and provides targeted recommendations for optimization.
   */
  const analyzeDrawingPerformance = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.drawingOperations.count === 0) return opportunities;

    // Slow drawing operations
    if (metrics.drawingOperations.averageTime > 16.67) {
      const id = generateOpportunityId('drawing', 'average_time');
      if (!dismissedOpportunitiesRef.current.has(id)) {
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
      if (!dismissedOpportunitiesRef.current.has(id)) {
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

    debugLog('Analysis', 'Drawing performance analyzed', {
      opportunitiesFound: opportunities.length,
      averageTime: metrics.drawingOperations.averageTime
    });

    return opportunities;
  }, [metrics.drawingOperations, generateOpportunityId]);

  /**
   * @function analyzeSyncPerformance
   * @description Analyze sync operations for optimization opportunities
   * @returns Array of sync-related optimization opportunities
   * 
   * @ai-context Identifies sync performance issues and provides
   * recommendations for improving real-time collaboration performance.
   */
  const analyzeSyncPerformance = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.syncOperations.count === 0) return opportunities;

    // Slow sync operations
    if (metrics.syncOperations.averageTime > 100) {
      const id = generateOpportunityId('sync', 'average_time');
      if (!dismissedOpportunitiesRef.current.has(id)) {
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
      if (!dismissedOpportunitiesRef.current.has(id)) {
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

    debugLog('Analysis', 'Sync performance analyzed', {
      opportunitiesFound: opportunities.length,
      averageTime: metrics.syncOperations.averageTime
    });

    return opportunities;
  }, [metrics.syncOperations, generateOpportunityId]);

  /**
   * @function analyzeRenderPerformance
   * @description Analyze render operations for optimization opportunities
   * @returns Array of render-related optimization opportunities
   * 
   * @ai-context Identifies rendering performance issues and provides
   * recommendations for improving canvas rendering performance.
   */
  const analyzeRenderPerformance = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.renderOperations.count === 0) return opportunities;

    // Low FPS
    if (metrics.renderOperations.fps < 50) {
      const id = generateOpportunityId('render', 'fps');
      if (!dismissedOpportunitiesRef.current.has(id)) {
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
      if (!dismissedOpportunitiesRef.current.has(id)) {
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

    debugLog('Analysis', 'Render performance analyzed', {
      opportunitiesFound: opportunities.length,
      fps: metrics.renderOperations.fps
    });

    return opportunities;
  }, [metrics.renderOperations, generateOpportunityId]);

  /**
   * @function analyzeMemoryUsage
   * @description Analyze memory usage for optimization opportunities
   * @returns Array of memory-related optimization opportunities
   * 
   * @ai-context Identifies memory usage issues and provides
   * recommendations for memory optimization and leak prevention.
   */
  const analyzeMemoryUsage = useCallback((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.memoryUsage.jsHeapSizeLimit === 0) return opportunities;

    const memoryUsageRatio = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;

    // High memory usage
    if (memoryUsageRatio > 0.8) {
      const id = generateOpportunityId('memory', 'high_usage');
      if (!dismissedOpportunitiesRef.current.has(id)) {
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

    debugLog('Analysis', 'Memory usage analyzed', {
      opportunitiesFound: opportunities.length,
      memoryUsageRatio: `${(memoryUsageRatio * 100).toFixed(1)}%`
    });

    return opportunities;
  }, [metrics.memoryUsage, generateOpportunityId]);

  /**
   * @function analyzePerformance
   * @description Perform comprehensive performance analysis
   * 
   * @ai-context Runs all analysis functions and updates the opportunities
   * list with current performance issues and recommendations.
   */
  const analyzePerformance = useCallback(() => {
    const now = Date.now();
    
    // Don't analyze too frequently
    if (now - lastAnalysisRef.current < 10000) return; // 10 seconds minimum
    
    lastAnalysisRef.current = now;

    debugLog('Analysis', 'Starting comprehensive performance analysis');

    const allOpportunities = [
      ...analyzeDrawingPerformance(),
      ...analyzeSyncPerformance(),
      ...analyzeRenderPerformance(),
      ...analyzeMemoryUsage()
    ];

    setOpportunities(allOpportunities);

    debugLog('Analysis', 'Performance analysis completed', {
      totalOpportunities: allOpportunities.length,
      byType: allOpportunities.reduce((acc, opp) => {
        acc[opp.type] = (acc[opp.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  }, [analyzeDrawingPerformance, analyzeSyncPerformance, analyzeRenderPerformance, analyzeMemoryUsage]);

  /**
   * @function dismissOpportunity
   * @description Dismiss an optimization opportunity
   * @param opportunityId - ID of the opportunity to dismiss
   * 
   * @ai-context Allows users to dismiss false positives or implemented
   * optimizations to keep the recommendations list relevant.
   */
  const dismissOpportunity = useCallback((opportunityId: string) => {
    dismissedOpportunitiesRef.current.add(opportunityId);
    setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
    
    debugLog('Dismiss', 'Opportunity dismissed', { opportunityId });
  }, []);

  /**
   * @function getSummary
   * @description Get optimization summary
   * @returns Summary of optimization opportunities and performance score
   * 
   * @ai-context Provides a high-level overview of optimization state
   * for dashboards and monitoring interfaces.
   */
  const getSummary = useCallback((): OptimizationSummary => {
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
  }, [opportunities, calculatePerformanceScore]);

  /**
   * @function getRecommendations
   * @description Get specific recommendations by type
   * @param type - Optional type filter
   * @param severity - Optional severity filter
   * @returns Filtered recommendations
   * 
   * @ai-context Provides filtered access to recommendations for
   * specific contexts or severity levels.
   */
  const getRecommendations = useCallback((
    type?: OptimizationOpportunity['type'],
    severity?: OptimizationOpportunity['severity']
  ): OptimizationOpportunity[] => {
    return opportunities.filter(opp => 
      (!type || opp.type === type) && 
      (!severity || opp.severity === severity)
    );
  }, [opportunities]);

  // Automatic analysis on metrics changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      analyzePerformance();
    }, 5000); // Analyze 5 seconds after metrics change

    return () => clearTimeout(timeoutId);
  }, [metrics, analyzePerformance]);

  debugLog('Hook', 'Optimization tracker initialized', {
    performanceScore: calculatePerformanceScore(),
    metricsAvailable: Object.keys(metrics).length > 0
  });

  return {
    opportunities,
    analyzePerformance,
    dismissOpportunity,
    getSummary,
    getRecommendations,
    performanceScore: calculatePerformanceScore()
  };
};
