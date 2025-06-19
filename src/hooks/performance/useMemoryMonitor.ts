
/**
 * @fileoverview JavaScript memory usage monitoring for performance tracking
 * @description Monitors JavaScript heap usage using the Performance Memory API for memory leak detection
 * 
 * @module useMemoryMonitor  
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const memoryMonitor = useMemoryMonitor((memoryUsage) => {
 *   console.log(`Memory: ${(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
 * });
 * 
 * // Check if memory monitoring is available
 * if (memoryMonitor.isMemoryApiAvailable()) {
 *   const ratio = memoryMonitor.getMemoryUsageRatio();
 *   console.log(`Memory usage: ${(ratio * 100).toFixed(1)}%`);
 * }
 * ```
 */

import { useCallback, useEffect } from 'react';
import { PerformanceMetrics } from './usePerformanceMetrics';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('memoryMonitor');

/**
 * @hook useMemoryMonitor
 * @description Memory usage monitoring hook with automatic periodic updates and leak detection
 * 
 * This hook integrates with the Performance Memory API (when available) to provide
 * real-time memory usage statistics. It works closely with:
 * - usePerformanceMetrics: Updates memory usage metrics
 * - usePerformanceReporting: Provides memory warnings
 * - useOptimizationTracker: Suggests memory optimizations
 * 
 * @param {Function} onMemoryUpdate - Callback invoked when memory usage is updated
 * 
 * @returns {Object} Memory monitoring interface
 * @returns {Function} returns.updateMemoryUsage - Manually trigger memory usage update
 * @returns {Function} returns.getMemoryUsageRatio - Get current memory usage as ratio (0-1)
 * @returns {Function} returns.isMemoryApiAvailable - Check if Performance Memory API is available
 * 
 * @example
 * ```typescript
 * // Integration with performance metrics
 * const metricsModule = usePerformanceMetrics();
 * const memoryMonitor = useMemoryMonitor(metricsModule.updateMemoryUsage);
 * 
 * // The monitor automatically updates metrics every 5 seconds
 * // and triggers warnings when memory usage is high
 * ```
 * 
 * @example
 * ```typescript
 * // Custom memory monitoring with alerts
 * const memoryMonitor = useMemoryMonitor((memoryUsage) => {
 *   const usedMB = memoryUsage.usedJSHeapSize / 1024 / 1024;
 *   const limitMB = memoryUsage.jsHeapSizeLimit / 1024 / 1024;
 *   
 *   if (usedMB > limitMB * 0.8) {
 *     console.warn(`High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
 *   }
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Manual memory checks
 * const memoryMonitor = useMemoryMonitor(() => {});
 * 
 * // Check memory before large operations
 * if (memoryMonitor.getMemoryUsageRatio() > 0.9) {
 *   console.warn('Memory usage critical - deferring operation');
 *   return;
 * }
 * 
 * performMemoryIntensiveOperation();
 * ```
 */
export const useMemoryMonitor = (onMemoryUpdate: (usage: PerformanceMetrics['memoryUsage']) => void) => {
  /**
   * @function updateMemoryUsage
   * @description Updates memory usage metrics if Performance Memory API is available
   * 
   * This function queries the browser's memory API and provides detailed heap statistics:
   * - usedJSHeapSize: Currently allocated memory
   * - totalJSHeapSize: Total heap size (may be larger than used)
   * - jsHeapSizeLimit: Maximum heap size before out-of-memory
   * 
   * @example
   * ```typescript
   * // Manual memory update
   * updateMemoryUsage();
   * 
   * // Typically called automatically every 5 seconds
   * ```
   */
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };

      onMemoryUpdate(memoryUsage);

      debugLog('Memory', 'Updated memory usage', {
        used: `${(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    } else {
      debugLog('Memory', 'Performance memory API not available');
    }
  }, [onMemoryUpdate]);

  /**
   * @function getMemoryUsageRatio
   * @description Calculates current memory usage as a ratio (0-1) for threshold checks
   * 
   * @returns {number} Memory usage ratio (0 = no usage, 1 = at limit, >1 = over limit)
   * 
   * @example
   * ```typescript
   * const ratio = getMemoryUsageRatio();
   * 
   * if (ratio > 0.9) {
   *   console.error('Critical memory usage!');
   * } else if (ratio > 0.7) {
   *   console.warn('High memory usage');
   * } else {
   *   console.log(`Memory usage: ${(ratio * 100).toFixed(1)}%`);
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Use in conditional operations
   * const canPerformOperation = getMemoryUsageRatio() < 0.85;
   * if (canPerformOperation) {
   *   performMemoryIntensiveDrawing();
   * } else {
   *   showMemoryWarning();
   * }
   * ```
   */
  const getMemoryUsageRatio = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return 0;
  }, []);

  /**
   * @function isMemoryApiAvailable
   * @description Checks if the Performance Memory API is available in the current browser
   * 
   * @returns {boolean} True if memory monitoring is available, false otherwise
   * 
   * @example
   * ```typescript
   * if (isMemoryApiAvailable()) {
   *   // Enable memory-based optimizations
   *   enableMemoryMonitoring();
   * } else {
   *   // Fallback to time-based optimizations
   *   console.info('Memory API not available - using time-based monitoring');
   * }
   * ```
   */
  const isMemoryApiAvailable = useCallback((): boolean => {
    return 'memory' in performance;
  }, []);

  /**
   * @effect Automatic memory monitoring setup
   * @description Sets up periodic memory monitoring with 5-second intervals
   */
  useEffect(() => {
    // Immediate initial update
    updateMemoryUsage();

    // Set up periodic monitoring
    const interval = setInterval(updateMemoryUsage, 5000);

    debugLog('Monitor', 'Memory monitor initialized', {
      memoryApiAvailable: isMemoryApiAvailable(),
      updateInterval: '5000ms'
    });

    return () => clearInterval(interval);
  }, [updateMemoryUsage, isMemoryApiAvailable]);

  return {
    updateMemoryUsage,
    getMemoryUsageRatio,
    isMemoryApiAvailable
  };
};
