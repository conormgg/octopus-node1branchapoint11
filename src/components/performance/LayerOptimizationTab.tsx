
/**
 * @fileoverview Layer optimization metrics tab
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Gauge } from 'lucide-react';
import { LayerOptimizationMetrics } from '@/hooks/performance/useLayerOptimizationMetrics';

interface LayerOptimizationTabProps {
  layerOptimization: LayerOptimizationMetrics;
  optimizationRecommendations: string[];
}

const LayerOptimizationTab: React.FC<LayerOptimizationTabProps> = ({
  layerOptimization,
  optimizationRecommendations
}) => {
  return (
    <div className="space-y-6">
      {/* Cache Performance & Adaptive Thresholds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Cache Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cache Hits:</span>
                <span className="font-mono text-green-600">{layerOptimization.cacheOperations.hits}</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Misses:</span>
                <span className="font-mono text-red-600">{layerOptimization.cacheOperations.misses}</span>
              </div>
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className="font-mono">{layerOptimization.cacheOperations.hitRate.toFixed(1)}%</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Cache Effectiveness</span>
                <span>{layerOptimization.cacheOperations.hitRate.toFixed(1)}%</span>
              </div>
              <Progress value={layerOptimization.cacheOperations.hitRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Adaptive Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Threshold:</span>
                <span className="font-mono">{layerOptimization.adaptiveThresholds.current}</span>
              </div>
              <div className="flex justify-between">
                <span>Baseline:</span>
                <span className="font-mono">{layerOptimization.adaptiveThresholds.baseline}</span>
              </div>
              <div className="flex justify-between">
                <span>Adjustments:</span>
                <span className="font-mono">{layerOptimization.adaptiveThresholds.adjustmentCount}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Threshold Stability</span>
                <span>{layerOptimization.adaptiveThresholds.adjustmentCount < 3 ? 'Stable' : 'Adaptive'}</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (layerOptimization.adaptiveThresholds.adjustmentCount * 10))} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Render Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Render Performance Comparison</CardTitle>
          <CardDescription>
            Performance impact of layer caching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {layerOptimization.renderPerformance.cachedRenderTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600">Cached Render Time</div>
              <div className="text-xs text-gray-500">
                ({layerOptimization.renderPerformance.totalCachedRenders} renders)
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {layerOptimization.renderPerformance.uncachedRenderTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600">Uncached Render Time</div>
              <div className="text-xs text-gray-500">
                ({layerOptimization.renderPerformance.totalUncachedRenders} renders)
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {layerOptimization.renderPerformance.performanceGain.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Performance Gain</div>
              <div className="text-xs text-gray-500">
                Improvement from caching
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Current Quality Score:</span>
            <span className="font-mono text-lg">
              {layerOptimization.qualityMetrics.lastQualityScore.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Average Quality:</span>
            <span className="font-mono">
              {layerOptimization.qualityMetrics.averageQualityScore.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Quality Trend:</span>
            <Badge variant={
              layerOptimization.qualityMetrics.qualityTrend === 'improving' ? 'default' :
              layerOptimization.qualityMetrics.qualityTrend === 'declining' ? 'destructive' : 'secondary'
            }>
              {layerOptimization.qualityMetrics.qualityTrend}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Layer Optimization Recommendations */}
      {optimizationRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Layer Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optimizationRecommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LayerOptimizationTab;
