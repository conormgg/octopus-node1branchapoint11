
/**
 * @fileoverview Performance monitoring for whiteboard operations
 * @description Tracks performance metrics, memory usage, and operation timing
 * for whiteboard operations to help identify bottlenecks and optimization opportunities.
 * 
 * @ai-context This hook provides comprehensive performance monitoring:
 * - Operation timing (drawing, syncing, rendering)
 * - Memory usage tracking
 * - FPS monitoring for canvas operations
 * - Sync performance metrics
 * - Automatic performance reporting
 */

import { useCallback, useRef, useEffect, useState } from 'react';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @interface PerformanceMetrics
 * @description Structure for tracking various performance metrics
 */
interface PerformanceMetrics {
  drawingOperations: {
    count: number;
    totalTime: number;
    averageTime: number;
    lastOperationTime: number;
  };
  syncOperations: {
    count: number;
    totalTime: number;
    averageTime: number;
    lastSyncTime: number;
  };
  renderOperations: {
    count: number;
    totalTime: number;
    averageTime: number;
    fps: number;
  };
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * @interface PerformanceReport
 * @description Comprehensive performance report structure
 */
interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  warnings: string[];
  recommendations: string[];
}

/**
 * @function debugLog
 * @description Performance-specific debug logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[Performance:${context}] ${action}`, data || '');
  }
};

/**
 * @hook usePerformanceMonitor
 * @description Comprehensive performance monitoring for whiteboard operations
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
 * 
 * @ai-understanding
 * This hook tracks:
 * 1. Operation timing for drawing, sync, and render operations
 * 2. Memory usage monitoring with heap size tracking
 * 3. FPS monitoring for smooth canvas operations
 * 4. Automatic performance warnings and recommendations
 * 5. Historical performance data for trend analysis
 */
export const usePerformanceMonitor = () => {
  debugLog('Hook', 'Initializing performance monitor');

  const timersRef = useRef<Map<string, number>>(new Map());
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    drawingOperations: {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      lastOperationTime: 0
    },
    syncOperations: {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      lastSyncTime: 0
    },
    renderOperations: {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      fps: 60
    },
    memoryUsage: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    }
  });

  /**
   * @function updateMemoryUsage
   * @description Updates memory usage metrics if available
   * 
   * @ai-context Uses the Performance Memory API when available
   * to track JavaScript heap usage for memory leak detection.
   */
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      }));
    }
  }, []);

  /**
   * @function startTimer
   * @description Start timing an operation
   * @param operationId - Unique identifier for the operation
   * 
   * @ai-context Creates high-resolution timestamps for accurate
   * performance measurement of whiteboard operations.
   */
  const startTimer = useCallback((operationId: string) => {
    timersRef.current.set(operationId, performance.now());
    debugLog('Timer', `Started timer for ${operationId}`);
  }, []);

  /**
   * @function endTimer
   * @description End timing an operation and return duration
   * @param operationId - Unique identifier for the operation
   * @returns Duration in milliseconds
   * 
   * @ai-context Calculates operation duration and cleans up timer.
   * Returns 0 if timer wasn't found to prevent errors.
   */
  const endTimer = useCallback((operationId: string): number => {
    const startTime = timersRef.current.get(operationId);
    if (!startTime) {
      debugLog('Timer', `Timer not found for ${operationId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    timersRef.current.delete(operationId);
    debugLog('Timer', `Ended timer for ${operationId}`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  }, []);

  /**
   * @function recordDrawingOperation
   * @description Record performance metrics for drawing operations
   * @param duration - Operation duration in milliseconds
   * 
   * @ai-context Updates drawing operation metrics with timing data.
   * Used to track pencil, highlighter, and eraser performance.
   */
  const recordDrawingOperation = useCallback((duration: number) => {
    setMetrics(prev => {
      const newCount = prev.drawingOperations.count + 1;
      const newTotalTime = prev.drawingOperations.totalTime + duration;
      const newAverageTime = newTotalTime / newCount;

      debugLog('Drawing', 'Recorded drawing operation', {
        duration: `${duration.toFixed(2)}ms`,
        averageTime: `${newAverageTime.toFixed(2)}ms`,
        count: newCount
      });

      return {
        ...prev,
        drawingOperations: {
          count: newCount,
          totalTime: newTotalTime,
          averageTime: newAverageTime,
          lastOperationTime: duration
        }
      };
    });
  }, []);

  /**
   * @function recordSyncOperation
   * @description Record performance metrics for sync operations
   * @param duration - Operation duration in milliseconds
   * 
   * @ai-context Updates sync operation metrics for real-time
   * collaboration performance monitoring.
   */
  const recordSyncOperation = useCallback((duration: number) => {
    setMetrics(prev => {
      const newCount = prev.syncOperations.count + 1;
      const newTotalTime = prev.syncOperations.totalTime + duration;
      const newAverageTime = newTotalTime / newCount;

      debugLog('Sync', 'Recorded sync operation', {
        duration: `${duration.toFixed(2)}ms`,
        averageTime: `${newAverageTime.toFixed(2)}ms`,
        count: newCount
      });

      return {
        ...prev,
        syncOperations: {
          count: newCount,
          totalTime: newTotalTime,
          averageTime: newAverageTime,
          lastSyncTime: duration
        }
      };
    });
  }, []);

  /**
   * @function recordRenderOperation
   * @description Record performance metrics for render operations
   * @param duration - Operation duration in milliseconds
   * 
   * @ai-context Updates render operation metrics and calculates
   * FPS for smooth canvas performance monitoring.
   */
  const recordRenderOperation = useCallback((duration: number) => {
    frameCountRef.current++;
    const currentTime = performance.now();
    const timeDiff = currentTime - lastFrameTimeRef.current;

    // Calculate FPS every second
    if (timeDiff >= 1000) {
      const fps = (frameCountRef.current * 1000) / timeDiff;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = currentTime;

      setMetrics(prev => {
        const newCount = prev.renderOperations.count + 1;
        const newTotalTime = prev.renderOperations.totalTime + duration;
        const newAverageTime = newTotalTime / newCount;

        debugLog('Render', 'Recorded render operation', {
          duration: `${duration.toFixed(2)}ms`,
          fps: fps.toFixed(1),
          averageTime: `${newAverageTime.toFixed(2)}ms`
        });

        return {
          ...prev,
          renderOperations: {
            count: newCount,
            totalTime: newTotalTime,
            averageTime: newAverageTime,
            fps: Math.round(fps)
          }
        };
      });
    }
  }, []);

  /**
   * @function getMetrics
   * @description Get current performance metrics
   * @returns Current performance metrics
   * 
   * @ai-context Provides read-only access to current performance
   * metrics for external monitoring and reporting.
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metrics };
  }, [metrics]);

  /**
   * @function generateReport
   * @description Generate comprehensive performance report with warnings and recommendations
   * @returns Complete performance report
   * 
   * @ai-context Analyzes current metrics to provide actionable
   * insights and recommendations for performance optimization.
   */
  const generateReport = useCallback((): PerformanceReport => {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check drawing performance
    if (metrics.drawingOperations.averageTime > 16.67) {
      warnings.push('Drawing operations exceeding 60 FPS target');
      recommendations.push('Consider optimizing drawing algorithms or reducing point density');
    }

    // Check sync performance
    if (metrics.syncOperations.averageTime > 100) {
      warnings.push('Sync operations taking longer than 100ms');
      recommendations.push('Consider batching sync operations or optimizing serialization');
    }

    // Check FPS
    if (metrics.renderOperations.fps < 50) {
      warnings.push('Frame rate below 50 FPS');
      recommendations.push('Consider reducing canvas complexity or implementing object culling');
    }

    // Check memory usage
    const memoryUsageRatio = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;
    if (memoryUsageRatio > 0.8) {
      warnings.push('High memory usage detected');
      recommendations.push('Consider implementing object pooling or memory cleanup');
    }

    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: { ...metrics },
      warnings,
      recommendations
    };

    debugLog('Report', 'Generated performance report', {
      warningsCount: warnings.length,
      recommendationsCount: recommendations.length,
      fps: metrics.renderOperations.fps
    });

    return report;
  }, [metrics]);

  // Update memory usage periodically
  useEffect(() => {
    const interval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage(); // Initial update

    debugLog('Hook', 'Performance monitor initialized', {
      memoryApiAvailable: 'memory' in performance
    });

    return () => clearInterval(interval);
  }, [updateMemoryUsage]);

  return {
    startTimer,
    endTimer,
    recordDrawingOperation,
    recordSyncOperation,
    recordRenderOperation,
    getMetrics,
    generateReport,
    metrics
  };
};
