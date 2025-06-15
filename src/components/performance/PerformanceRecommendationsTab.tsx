/**
 * @fileoverview Performance recommendations tab
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { OptimizationSummary, OptimizationOpportunity } from '@/hooks/performance/useOptimizationTracker';

interface PerformanceRecommendationsTabProps {
  summary: OptimizationSummary;
}

const PerformanceRecommendationsTab: React.FC<PerformanceRecommendationsTabProps> = ({ summary }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (summary.topRecommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Action Required</h3>
          <p className="text-gray-600">All systems are performing optimally.</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
};

export default PerformanceRecommendationsTab;
