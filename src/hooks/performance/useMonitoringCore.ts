
/**
 * @fileoverview Core monitoring integration logic
 * @description Handles the core integration between performance monitoring and the application
 * 
 * @ai-context This module coordinates the monitoring system with periodic reporting
 * and debugging output for development environments.
 */

import { useEffect, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

interface UseMonitoringCoreProps {
  isEnabled: boolean;
  generateReport: () => any;
  metrics: any;
}

/**
 * @hook useMonitoringCore
 * @description Provides core monitoring integration functionality
 */
export const useMonitoringCore = ({
  isEnabled,
  generateReport,
  metrics
}: UseMonitoringCoreProps) => {
  
  /**
   * @function getPerformanceReport
   * @description Get current performance report
   */
  const getPerformanceReport = useCallback(() => {
    return generateReport();
  }, [generateReport]);

  // Log performance metrics periodically in debug mode
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const report = generateReport();
      if (report.warnings.length > 0) {
        debugLog('Report', 'Performance warnings detected', {
          warnings: report.warnings,
          recommendations: report.recommendations
        });
      }
    }, 30000); // Every 30 seconds

    debugLog('Hook', 'Monitoring integration initialized', {
      metricsTracking: true,
      periodicReporting: true
    });

    return () => clearInterval(interval);
  }, [isEnabled, generateReport]);

  return {
    getPerformanceReport,
    metrics,
    isEnabled
  };
};
