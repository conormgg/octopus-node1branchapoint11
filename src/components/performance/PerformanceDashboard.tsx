
/**
 * @fileoverview Performance monitoring dashboard component
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonitoringIntegration } from '@/hooks/performance/useMonitoringIntegration';
import { useOptimizationTracker } from '@/hooks/performance/useOptimizationTracker';
import { usePerformanceMonitorExtended } from '@/hooks/performance/usePerformanceMonitorExtended';
import { Activity, X } from 'lucide-react';
import PerformanceOverviewTab from './PerformanceOverviewTab';
import LayerOptimizationTab from './LayerOptimizationTab';
import PerformanceMetricsTab from './PerformanceMetricsTab';
import PerformanceOpportunitiesTab from './PerformanceOpportunitiesTab';
import PerformanceRecommendationsTab from './PerformanceRecommendationsTab';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible = true,
  onClose,
  className = ''
}) => {
  const { metrics, isEnabled } = useMonitoringIntegration();
  const { 
    opportunities, 
    performanceScore, 
    getSummary, 
    dismissOpportunity,
    analyzePerformance 
  } = useOptimizationTracker();

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
  const extendedMetrics = extendedMonitor.getExtendedMetrics();
  const layerOptimization = extendedMetrics.layerOptimization;
  const optimizationRecommendations = extendedMonitor.getOptimizationRecommendations();

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

            <TabsContent value="overview">
              <PerformanceOverviewTab 
                metrics={metrics}
                layerOptimization={layerOptimization}
                performanceScore={performanceScore}
                summary={summary}
              />
            </TabsContent>

            <TabsContent value="layer-optimization">
              <LayerOptimizationTab 
                layerOptimization={layerOptimization}
                optimizationRecommendations={optimizationRecommendations}
              />
            </TabsContent>

            <TabsContent value="metrics">
              <PerformanceMetricsTab metrics={metrics} />
            </TabsContent>

            <TabsContent value="opportunities">
              <PerformanceOpportunitiesTab 
                opportunities={opportunities}
                dismissOpportunity={dismissOpportunity}
              />
            </TabsContent>

            <TabsContent value="recommendations">
              <PerformanceRecommendationsTab summary={summary} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
