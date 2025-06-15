
/**
 * @fileoverview Main optimization tracking coordinator
 * @description Coordinates all optimization analysis modules and provides unified interface
 */

import { useState, useCallback, useEffect } from 'react';
import { useDrawingAnalysis } from './optimization/useDrawingAnalysis';
import { useSyncAnalysis } from './optimization/useSyncAnalysis';
import { useRenderAnalysis } from './optimization/useRenderAnalysis';
import { useMemoryAnalysis } from './optimization/useMemoryAnalysis';
import { usePerformanceScoring } from './optimization/usePerformanceScoring';
import { OptimizationOpportunity, OptimizationSummary } from './optimization/types';

/**
 * @hook useOptimizationTracker
 * @description Main coordination hook for performance optimization tracking
 */
export const useOptimizationTracker = () => {
  const [dismissedOpportunities, setDismissedOpportunities] = useState<Set<string>>(new Set());
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([]);
  const [performanceScore, setPerformanceScore] = useState<number>(100);

  // Initialize analysis modules
  const drawingAnalysis = useDrawingAnalysis(dismissedOpportunities);
  const syncAnalysis = useSyncAnalysis(dismissedOpportunities);
  const renderAnalysis = useRenderAnalysis(dismissedOpportunities);
  const memoryAnalysis = useMemoryAnalysis(dismissedOpportunities);
  const performanceScoring = usePerformanceScoring();

  /**
   * @function analyzePerformance
   * @description Run comprehensive performance analysis
   */
  const analyzePerformance = useCallback(() => {
    const allOpportunities: OptimizationOpportunity[] = [
      ...drawingAnalysis.analyze(),
      ...syncAnalysis.analyze(),
      ...renderAnalysis.analyze(),
      ...memoryAnalysis.analyze()
    ];

    setOpportunities(allOpportunities);
    setPerformanceScore(performanceScoring.calculatePerformanceScore());
  }, [drawingAnalysis, syncAnalysis, renderAnalysis, memoryAnalysis, performanceScoring]);

  /**
   * @function dismissOpportunity
   * @description Dismiss an optimization opportunity
   */
  const dismissOpportunity = useCallback((opportunityId: string) => {
    setDismissedOpportunities(prev => new Set([...prev, opportunityId]));
    setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
  }, []);

  /**
   * @function getSummary
   * @description Get optimization summary with current opportunities
   */
  const getSummary = useCallback((): OptimizationSummary => {
    return performanceScoring.generateSummary(opportunities);
  }, [opportunities, performanceScoring]);

  /**
   * @function getRecommendations
   * @description Get filtered recommendations
   */
  const getRecommendations = useCallback((
    type?: OptimizationOpportunity['type'],
    severity?: OptimizationOpportunity['severity']
  ): OptimizationOpportunity[] => {
    return performanceScoring.getRecommendations(opportunities, type, severity);
  }, [opportunities, performanceScoring]);

  // Auto-analyze on mount and when dependencies change
  useEffect(() => {
    analyzePerformance();
  }, [analyzePerformance]);

  return {
    opportunities,
    performanceScore,
    analyzePerformance,
    dismissOpportunity,
    getSummary,
    getRecommendations
  };
};
