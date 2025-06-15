
/**
 * @fileoverview Performance monitoring coordination
 * @description Coordinates all performance monitoring modules
 */

import { useCallback } from 'react';
import { usePerformanceMetrics, PerformanceMetrics } from '../usePerformanceMetrics';
import { usePerformanceTimers } from '../usePerformanceTimers';
import { useMemoryMonitor } from '../useMemoryMonitor';
import { usePerformanceReporting, PerformanceReport } from '../usePerformanceReporting';
import { useFpsTracker } from '../useFpsTracker';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

/**
 * @hook usePerformanceCoordinator
 * @description Coordinates all performance monitoring modules
 */
export const usePerformanceCoordinator = () => {
  debugLog('Hook', 'Initializing performance coordinator');

  // Initialize all monitoring modules
  const metricsModule = usePerformanceMetrics();
  const timersModule = usePerformanceTimers();
  const reportingModule = usePerformanceReporting();
  const fpsTracker = useFpsTracker();

  // Initialize memory monitoring with metrics update callback
  const memoryMonitor = useMemoryMonitor(metricsModule.updateMemoryUsage);

  /**
   * @function recordRenderOperation
   * @description Record performance metrics for render operations with FPS tracking
   */
  const recordRenderOperation = useCallback((duration: number) => {
    const fps = fpsTracker.trackFrame();
    const currentFps = fps !== null ? fps : metricsModule.metrics.renderOperations.fps;
    metricsModule.recordRenderOperation(duration, currentFps);
  }, [fpsTracker, metricsModule]);

  /**
   * @function generateReport
   * @description Generate comprehensive performance report
   */
  const generateReport = useCallback((): PerformanceReport => {
    const currentMetrics = metricsModule.getMetrics();
    const report = reportingModule.generateReport(currentMetrics);
    
    debugLog('Coordination', 'Generated comprehensive report', {
      warningsCount: report.warnings.length,
      recommendationsCount: report.recommendations.length,
      memoryApiAvailable: memoryMonitor.isMemoryApiAvailable()
    });
    
    return report;
  }, [metricsModule, reportingModule, memoryMonitor]);

  debugLog('Hook', 'Performance coordinator initialized');

  return {
    // Timer operations
    startTimer: timersModule.startTimer,
    endTimer: timersModule.endTimer,
    
    // Metrics recording
    recordDrawingOperation: metricsModule.recordDrawingOperation,
    recordSyncOperation: metricsModule.recordSyncOperation,
    recordRenderOperation,
    
    // Data access
    getMetrics: metricsModule.getMetrics,
    generateReport,
    metrics: metricsModule.metrics,
    
    // Memory monitoring utilities
    getMemoryUsageRatio: memoryMonitor.getMemoryUsageRatio,
    isMemoryApiAvailable: memoryMonitor.isMemoryApiAvailable
  };
};

// Export types for external use
export type { PerformanceMetrics, PerformanceReport };
