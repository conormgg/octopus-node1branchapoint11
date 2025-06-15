
/**
 * @fileoverview Core monitoring functionality
 * @description Provides core monitoring utilities and report generation
 */

import { useCallback } from 'react';
import { PerformanceMetrics, PerformanceReport } from './usePerformanceMonitor';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

interface UseMonitoringCoreProps {
  isEnabled: boolean;
  generateReport: () => PerformanceReport;
  metrics: PerformanceMetrics;
}

/**
 * @hook useMonitoringCore
 * @description Provides core monitoring utilities and coordination
 */
export const useMonitoringCore = ({
  isEnabled,
  generateReport,
  metrics
}: UseMonitoringCoreProps) => {

  /**
   * @function getPerformanceReport
   * @description Generate and return current performance report
   */
  const getPerformanceReport = useCallback((): PerformanceReport | null => {
    if (!isEnabled) {
      debugLog('Core', 'Performance monitoring disabled, returning null report');
      return null;
    }

    const report = generateReport();
    debugLog('Core', 'Generated performance report', {
      warningsCount: report.warnings.length,
      recommendationsCount: report.recommendations.length,
      timestamp: report.timestamp
    });

    return report;
  }, [isEnabled, generateReport]);

  return {
    getPerformanceReport
  };
};
