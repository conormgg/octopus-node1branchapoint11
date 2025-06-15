/**
 * @fileoverview Detailed performance metrics tab
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PerformanceMetrics } from '@/hooks/performance/usePerformanceMonitor';

interface PerformanceMetricsTabProps {
  metrics: PerformanceMetrics;
}

const PerformanceMetricsTab: React.FC<PerformanceMetricsTabProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default PerformanceMetricsTab;
