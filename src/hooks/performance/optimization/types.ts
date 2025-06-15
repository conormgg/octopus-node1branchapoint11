
/**
 * @fileoverview Types and interfaces for optimization tracking
 * @description Shared type definitions for the optimization tracking system
 */

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
 * @interface AnalysisModule
 * @description Common interface for analysis modules
 */
export interface AnalysisModule {
  analyze: () => OptimizationOpportunity[];
}
