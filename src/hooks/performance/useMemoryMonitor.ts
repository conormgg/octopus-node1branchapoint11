
/**
 * @fileoverview Memory usage monitoring
 * @description Tracks JavaScript heap usage for memory leak detection
 */

import { useCallback, useEffect } from 'react';
import { PerformanceMetrics } from './usePerformanceMetrics';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Memory-specific debug logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[MemoryMonitor:${context}] ${action}`, data || '');
  }
};

/**
 * @hook useMemoryMonitor
 * @description Memory usage monitoring for performance tracking
 */
export const useMemoryMonitor = (onMemoryUpdate: (usage: PerformanceMetrics['memoryUsage']) => void) => {
  /**
   * @function updateMemoryUsage
   * @description Updates memory usage metrics if available
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
   * @description Get current memory usage as a ratio (0-1)
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
   * @description Check if the Performance Memory API is available
   */
  const isMemoryApiAvailable = useCallback((): boolean => {
    return 'memory' in performance;
  }, []);

  // Set up periodic memory monitoring
  useEffect(() => {
    const interval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage(); // Initial update

    debugLog('Monitor', 'Memory monitor initialized', {
      memoryApiAvailable: isMemoryApiAvailable()
    });

    return () => clearInterval(interval);
  }, [updateMemoryUsage, isMemoryApiAvailable]);

  return {
    updateMemoryUsage,
    getMemoryUsageRatio,
    isMemoryApiAvailable
  };
};
