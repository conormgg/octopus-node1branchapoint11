
/**
 * @fileoverview Performance overview tab content
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, Layers } from 'lucide-react';
import { PerformanceMetrics } from '@/hooks/performance/useMonitoringIntegration';
import { LayerOptimizationMetrics } from '@/hooks/performance/useLayerOptimizationMetrics';
import { OptimizationSummary } from '@/hooks/performance/useOptimizationTracker';
import PerformanceQuickStats from './PerformanceQuickStats';

interface PerformanceOverviewTabProps {
  metrics: PerformanceMetrics;
  layerOptimization: LayerOptimizationMetrics;
  performanceScore: number;
  summary: OptimizationSummary;
}

const PerformanceOverviewTab: React.FC<PerformanceOverviewTabProps> = ({
  metrics,
  layerOptimization,
  performanceScore,
  summary
}) => {
  const getPerformanceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-orange-600';
      case 'disabled': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Score
          </CardTitle>
          <CardDescription>
            Overall performance health based on key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getPerformanceScoreColor(performanceScore)}`}>
              {performanceScore}/100
            </div>
            <div className="flex-1">
              <Progress value={performanceScore} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                {performanceScore >= 90 && 'Excellent performance!'}
                {performanceScore >= 70 && performanceScore < 90 && 'Good performance with room for improvement'}
                {performanceScore >= 50 && performanceScore < 70 && 'Performance needs attention'}
                {performanceScore < 50 && 'Critical performance issues detected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <PerformanceQuickStats metrics={metrics} layerOptimization={layerOptimization} />

      {/* Layer Optimization Summary */}
      {layerOptimization.cacheOperations.totalOperations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Layer Optimization Status
            </CardTitle>
            <CardDescription>
              Performance impact of layer caching optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {layerOptimization.renderPerformance.performanceGain.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Performance Gain</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {layerOptimization.adaptiveThresholds.current}
                </div>
                <div className="text-sm text-gray-600">Adaptive Threshold</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${getEffectivenessColor('medium')}`}>
                  {layerOptimization.qualityMetrics.lastQualityScore.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Quality Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Summary */}
      {summary.totalOpportunities > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription>
              {summary.totalOpportunities} opportunities identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.criticalCount}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{summary.highCount}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summary.mediumCount}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.lowCount}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceOverviewTab;
