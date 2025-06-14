
/**
 * @fileoverview Performance monitoring for whiteboard operations
 * @description Coordinates performance tracking modules for comprehensive monitoring
 * 
 * @ai-context This hook coordinates multiple performance monitoring modules:
 * - Core metrics tracking (drawing, sync, render operations)
 * - High-resolution timer operations
 * - Memory usage monitoring
 * - FPS tracking for canvas operations
 * - Performance report generation
 */

import { useCallback } from 'react';
import { usePerformanceMetrics, PerformanceMetrics } from './usePerformanceMetrics';
import { usePerformanceTimers } from './usePerformanceTimers';
import { useMemoryMonitor } from './useMemoryMonitor';
import { usePerformanceReporting, PerformanceReport } from './usePerformanceReporting';
import { useFpsTracker } from './useFpsTracker';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Performance monitor coordination logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[PerformanceMonitor:${context}] ${action}`, data || '');
  }
};

/**
 * @hook usePerformanceMonitor
 * @description Comprehensive performance monitoring coordination hook
 * 
 * @returns {Object} Performance monitoring interface
 * @returns {Function} startTimer - Start timing an operation
 * @returns {Function} endTimer - End timing an operation
 * @returns {Function} recordDrawingOperation - Record drawing performance
 * @returns {Function} recordSyncOperation - Record sync performance
 * @returns {Function} recordRenderOperation - Record render performance
 * @returns {Function} getMetrics - Get current performance metrics
 * @returns {Function} generateReport - Generate comprehensive performance report
 * @returns {PerformanceMetrics} metrics - Current performance metrics
 */
export const usePerformanceMonitor = () => {
  debugLog('Hook', 'Initializing performance monitor coordination');

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
   * @param duration - Operation duration in milliseconds
   */
  const recordRenderOperation = useCallback((duration: number) => {
    // Track frame and get FPS if available
    const fps = fpsTracker.trackFrame();
    
    // Use current FPS or maintain previous FPS
    const currentFps = fps !== null ? fps : metricsModule.metrics.renderOperations.fps;
    
    // Record the render operation with FPS data
    metricsModule.recordRenderOperation(duration, currentFps);
  }, [fpsTracker, metricsModule]);

  /**
   * @function generateReport
   * @description Generate comprehensive performance report
   * @returns Complete performance report with analysis
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

  debugLog('Hook', 'Performance monitor coordination initialized', {
    memoryApiAvailable: memoryMonitor.isMemoryApiAvailable()
  });

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
