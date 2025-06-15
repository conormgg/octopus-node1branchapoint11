/**
 * @fileoverview Performance monitoring dashboard component
 * @description Displays real-time performance metrics, optimization opportunities,
 * and recommendations for whiteboard performance monitoring with layer optimization.
 * 
 * @ai-context This component provides a comprehensive view of whiteboard
 * performance, including metrics visualization, optimization recommendations,
 * and actionable insights for performance improvement.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonitoringIntegration } from '@/hooks/performance/useMonitoringIntegration';
import { useOptimizationTracker } from '@/hooks/performance/useOptimizationTracker';
import { usePerformanceMonitorExtended } from '@/hooks/performance/usePerformanceMonitorExtended';
import { Activity, Clock, Zap, MemoryStick, X, TrendingUp, AlertTriangle, Layers, Target, Gauge } from 'lucide-react';

/**
 * @interface PerformanceDashboardProps
 * @description Props for the PerformanceDashboard component
 */
interface PerformanceDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * @component PerformanceDashboard
 * @description Performance monitoring and optimization dashboard
 * 
 * @param isVisible - Whether the dashboard is visible
 * @param onClose - Callback when dashboard is closed
 * @param className - Additional CSS classes
 * 
 * @ai-understanding
 * This dashboard provides:
 * 1. Real-time performance metrics visualization
 * 2. Optimization opportunities and recommendations
 * 3. Performance score and trends
 * 4. Actionable insights for performance improvement
 * 5. Detailed metrics breakdown by operation type
 */
const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible = true,
  onClose,
  className = ''
}) => {
  const { metrics, getPerformanceReport, isEnabled } = useMonitoringIntegration();
  const { 
    opportunities, 
    performanceScore, 
    getSummary, 
    dismissOpportunity,
    analyzePerformance 
  } = useOptimizationTracker();

  // Phase 2D.4: Extended performance monitoring integration
  const extendedMonitor = usePerformanceMonitorExtended();

  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isVisible || !isEnabled) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
      analyzePerformance();
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, isEnabled, analyzePerformance]);

  if (!isVisible || !isEnabled) {
    return null;
  }

  const summary = getSummary();
  
  // Phase 2D.4: Get extended metrics and layer optimization data
  const extendedMetrics = extendedMonitor.getExtendedMetrics();
  const layerOptimization = extendedMetrics.layerOptimization;
  const optimizationRecommendations = extendedMonitor.getOptimizationRecommendations();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPerformanceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Phase 2D.4: Get layer optimization effectiveness color
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
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Performance Dashboard</h2>
              <p className="text-gray-600">
                Real-time monitoring with layer optimization insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="layer-optimization">Layer Optimization</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
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

              {/* Quick Stats with Layer Optimization */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Avg Drawing Time</p>
                        <p className="text-lg font-semibold">
                          {metrics.drawingOperations.averageTime.toFixed(1)}ms
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Frame Rate</p>
                        <p className="text-lg font-semibold">
                          {metrics.renderOperations.fps} FPS
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Sync Time</p>
                        <p className="text-lg font-semibold">
                          {metrics.syncOperations.averageTime.toFixed(1)}ms
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <MemoryStick className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Memory Usage</p>
                        <p className="text-lg font-semibold">
                          {((metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phase 2D.4: Layer Optimization Quick Stat */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-sm text-gray-600">Cache Hit Rate</p>
                        <p className="text-lg font-semibold">
                          {layerOptimization.cacheOperations.hitRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Phase 2D.4: Layer Optimization Summary */}
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
            </TabsContent>

            <TabsContent value="layer-optimization" className="space-y-6">
              {/* Phase 2D.4: Comprehensive Layer Optimization Dashboard */}
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
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Drawing Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Count:</span>
                      <span className="font-mono">{metrics.drawingOperations.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Time:</span>
                      <span className="font-mono">{metrics.drawingOperations.averageTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Time:</span>
                      <span className="font-mono">{metrics.drawingOperations.totalTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Operation:</span>
                      <span className="font-mono">{metrics.drawingOperations.lastOperationTime.toFixed(2)}ms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sync Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Count:</span>
                      <span className="font-mono">{metrics.syncOperations.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Time:</span>
                      <span className="font-mono">{metrics.syncOperations.averageTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Time:</span>
                      <span className="font-mono">{metrics.syncOperations.totalTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span className="font-mono">{metrics.syncOperations.lastSyncTime.toFixed(2)}ms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Render Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Count:</span>
                      <span className="font-mono">{metrics.renderOperations.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Time:</span>
                      <span className="font-mono">{metrics.renderOperations.averageTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frame Rate:</span>
                      <span className="font-mono">{metrics.renderOperations.fps} FPS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Time:</span>
                      <span className="font-mono">{metrics.renderOperations.totalTime.toFixed(2)}ms</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Memory Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Used JS Heap:</span>
                      <span className="font-mono">{(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total JS Heap:</span>
                      <span className="font-mono">{(metrics.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>JS Heap Limit:</span>
                      <span className="font-mono">{(metrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  
                  {metrics.memoryUsage.jsHeapSizeLimit > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memory Usage</span>
                        <span>{((metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={(metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4">
              {opportunities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Great Performance!</h3>
                    <p className="text-gray-600">No optimization opportunities detected at this time.</p>
                  </CardContent>
                </Card>
              ) : (
                opportunities.map((opportunity) => (
                  <Card key={opportunity.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {opportunity.title}
                            <Badge variant={getSeverityColor(opportunity.severity) as any}>
                              {opportunity.severity}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{opportunity.description}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissOpportunity(opportunity.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Recommendation:</h4>
                          <p className="text-sm text-gray-700">{opportunity.recommendation}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Expected Impact:</h4>
                          <p className="text-sm text-gray-700">{opportunity.impact}</p>
                        </div>
                        {opportunity.currentValue && opportunity.targetValue && (
                          <div className="flex items-center gap-4 text-sm">
                            <span>Current: <span className="font-mono">{opportunity.currentValue.toFixed(2)}</span></span>
                            <span>Target: <span className="font-mono">{opportunity.targetValue.toFixed(2)}</span></span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {summary.topRecommendations.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Action Required</h3>
                    <p className="text-gray-600">All systems are performing optimally.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Top Priority Recommendations</h3>
                    <p className="text-gray-600">Focus on these high-impact optimizations first.</p>
                  </div>
                  
                  {summary.topRecommendations.map((rec, index) => (
                    <Card key={rec.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {index + 1}
                          </span>
                          {rec.title}
                          <Badge variant={getSeverityColor(rec.severity) as any}>
                            {rec.severity}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-gray-700">{rec.recommendation}</p>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-sm text-green-800 mb-1">Expected Impact:</h4>
                            <p className="text-sm text-green-700">{rec.impact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
