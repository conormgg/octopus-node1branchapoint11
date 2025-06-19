
/**
 * @fileoverview Core performance metrics tracking
 * @description Manages drawing, sync, and render operation metrics with comprehensive tracking
 * 
 * @module usePerformanceMetrics
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const metricsModule = usePerformanceMetrics();
 * 
 * // Record a drawing operation
 * metricsModule.recordDrawingOperation(15.2);
 * 
 * // Get current metrics
 * const currentMetrics = metricsModule.getMetrics();
 * console.log(`Average draw time: ${currentMetrics.drawingOperations.averageTime}ms`);
 * ```
 */

import { useState, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performanceMetrics');

/**
 * @interface PerformanceMetrics
 * @description Comprehensive structure for tracking various performance metrics across all whiteboard operations
 * 
 * @property {Object} drawingOperations - Metrics for drawing/sketching operations
 * @property {Object} syncOperations - Metrics for real-time synchronization operations
 * @property {Object} renderOperations - Metrics for canvas rendering operations
 * @property {Object} memoryUsage - JavaScript heap memory usage statistics
 */
export interface PerformanceMetrics {
  drawingOperations: {
    /** Total number of drawing operations performed */
    count: number;
    /** Cumulative time spent on all drawing operations (ms) */
    totalTime: number;
    /** Average time per drawing operation (ms) */
    averageTime: number;
    /** Duration of the most recent drawing operation (ms) */
    lastOperationTime: number;
  };
  syncOperations: {
    /** Total number of sync operations performed */
    count: number;
    /** Cumulative time spent on all sync operations (ms) */
    totalTime: number;
    /** Average time per sync operation (ms) */
    averageTime: number;
    /** Duration of the most recent sync operation (ms) */
    lastSyncTime: number;
  };
  renderOperations: {
    /** Total number of render operations performed */
    count: number;
    /** Cumulative time spent on all render operations (ms) */
    totalTime: number;
    /** Average time per render operation (ms) */
    averageTime: number;
    /** Current frames per second */
    fps: number;
  };
  memoryUsage: {
    /** Currently used JavaScript heap size (bytes) */
    usedJSHeapSize: number;
    /** Total allocated JavaScript heap size (bytes) */
    totalJSHeapSize: number;
    /** Maximum JavaScript heap size limit (bytes) */
    jsHeapSizeLimit: number;
  };
}

/**
 * @hook usePerformanceMetrics
 * @description Core metrics tracking hook for comprehensive performance monitoring
 * 
 * This hook serves as the foundation of the performance monitoring system, providing
 * essential metrics collection and calculation capabilities. It integrates with:
 * - usePerformanceTimers: For high-resolution timing operations
 * - useMemoryMonitor: For memory usage tracking
 * - usePerformanceReporting: For generating analysis reports
 * 
 * @returns {Object} Performance metrics management interface
 * @returns {PerformanceMetrics} returns.metrics - Current performance metrics state
 * @returns {Function} returns.recordDrawingOperation - Record drawing operation timing
 * @returns {Function} returns.recordSyncOperation - Record sync operation timing
 * @returns {Function} returns.recordRenderOperation - Record render operation timing
 * @returns {Function} returns.updateMemoryUsage - Update memory usage statistics
 * @returns {Function} returns.getMetrics - Get current metrics snapshot
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const {
 *   metrics,
 *   recordDrawingOperation,
 *   recordSyncOperation,
 *   getMetrics
 * } = usePerformanceMetrics();
 * 
 * // Record operations
 * recordDrawingOperation(12.5); // 12.5ms drawing time
 * recordSyncOperation(85.2);    // 85.2ms sync time
 * 
 * // Access current metrics
 * const currentMetrics = getMetrics();
 * console.log(`Drawing avg: ${currentMetrics.drawingOperations.averageTime}ms`);
 * ```
 * 
 * @example
 * ```typescript
 * // Integration with other performance hooks
 * const metricsModule = usePerformanceMetrics();
 * const timersModule = usePerformanceTimers();
 * 
 * // Coordinate timing and recording
 * const operationId = 'draw-pencil-stroke';
 * timersModule.startTimer(operationId);
 * 
 * // ... perform drawing operation ...
 * 
 * const duration = timersModule.endTimer(operationId);
 * metricsModule.recordDrawingOperation(duration);
 * ```
 */
export const usePerformanceMetrics = () => {
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
   * @function recordDrawingOperation
   * @description Records performance metrics for drawing operations with automatic average calculation
   * 
   * @param {number} duration - Operation duration in milliseconds
   * 
   * @example
   * ```typescript
   * // Record a pencil stroke that took 15.2ms
   * recordDrawingOperation(15.2);
   * 
   * // The hook automatically updates:
   * // - count (incremented)
   * // - totalTime (accumulated)
   * // - averageTime (recalculated)
   * // - lastOperationTime (set to current duration)
   * ```
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
   * @description Records performance metrics for synchronization operations with automatic average calculation
   * 
   * @param {number} duration - Operation duration in milliseconds
   * 
   * @example
   * ```typescript
   * // Record a Supabase sync that took 85.7ms
   * recordSyncOperation(85.7);
   * ```
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
   * @description Records performance metrics for render operations with FPS tracking
   * 
   * @param {number} duration - Render operation duration in milliseconds
   * @param {number} fps - Current frames per second
   * 
   * @example
   * ```typescript
   * // Record a canvas render that took 8.3ms at 58 FPS
   * recordRenderOperation(8.3, 58);
   * ```
   */
  const recordRenderOperation = useCallback((duration: number, fps: number) => {
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
  }, []);

  /**
   * @function updateMemoryUsage
   * @description Updates memory usage metrics from browser Performance API
   * 
   * @param {PerformanceMetrics['memoryUsage']} memoryUsage - Memory usage statistics
   * 
   * @example
   * ```typescript
   * // Typically called by useMemoryMonitor
   * const memoryStats = {
   *   usedJSHeapSize: 15728640,    // ~15MB
   *   totalJSHeapSize: 20971520,   // ~20MB  
   *   jsHeapSizeLimit: 2147483648  // ~2GB
   * };
   * updateMemoryUsage(memoryStats);
   * ```
   */
  const updateMemoryUsage = useCallback((memoryUsage: PerformanceMetrics['memoryUsage']) => {
    setMetrics(prev => ({
      ...prev,
      memoryUsage
    }));
  }, []);

  /**
   * @function getMetrics
   * @description Returns a snapshot of current performance metrics
   * 
   * @returns {PerformanceMetrics} Current metrics snapshot (deep copy)
   * 
   * @example
   * ```typescript
   * const snapshot = getMetrics();
   * 
   * // Safe to modify returned object without affecting internal state
   * snapshot.drawingOperations.count = 999; // Won't affect internal metrics
   * 
   * console.log(`Current FPS: ${snapshot.renderOperations.fps}`);
   * console.log(`Memory usage: ${(snapshot.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
   * ```
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metrics };
  }, [metrics]);

  return {
    metrics,
    recordDrawingOperation,
    recordSyncOperation,
    recordRenderOperation,
    updateMemoryUsage,
    getMetrics
  };
};
