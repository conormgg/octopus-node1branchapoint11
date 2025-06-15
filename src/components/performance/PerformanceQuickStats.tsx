
/**
 * @fileoverview Quick performance statistics cards
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap, Activity, MemoryStick, Layers } from 'lucide-react';
import { PerformanceMetrics } from '@/hooks/performance/useMonitoringIntegration';
import { LayerOptimizationMetrics } from '@/hooks/performance/useLayerOptimizationMetrics';

interface PerformanceQuickStatsProps {
  metrics: PerformanceMetrics;
  layerOptimization: LayerOptimizationMetrics;
}

const PerformanceQuickStats: React.FC<PerformanceQuickStatsProps> = ({
  metrics,
  layerOptimization
}) => {
  return (
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
  );
};

export default PerformanceQuickStats;
