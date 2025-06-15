/**
 * @fileoverview Performance opportunities tab
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, X } from 'lucide-react';
import { OptimizationOpportunity } from '@/hooks/performance/useOptimizationTracker';

interface PerformanceOpportunitiesTabProps {
  opportunities: OptimizationOpportunity[];
  dismissOpportunity: (id: string) => void;
}

const PerformanceOpportunitiesTab: React.FC<PerformanceOpportunitiesTabProps> = ({
  opportunities,
  dismissOpportunity
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Great Performance!</h3>
          <p className="text-gray-600">No optimization opportunities detected at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity) => (
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
      ))}
    </div>
  );
};

export default PerformanceOpportunitiesTab;
