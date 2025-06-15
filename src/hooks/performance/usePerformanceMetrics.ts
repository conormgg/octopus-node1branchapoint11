
/**
 * @fileoverview Core performance metrics tracking
 * @description Manages drawing, sync, and render operation metrics
 */

import { useState, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performanceMetrics');

/**
 * @interface PerformanceMetrics
 * @description Structure for tracking various performance metrics
 */
export interface PerformanceMetrics {
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
 * @hook usePerformanceMetrics
 * @description Core metrics tracking for performance monitoring
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
   * @description Record performance metrics for drawing operations
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
   * @description Update memory usage metrics
   */
  const updateMemoryUsage = useCallback((memoryUsage: PerformanceMetrics['memoryUsage']) => {
    setMetrics(prev => ({
      ...prev,
      memoryUsage
    }));
  }, []);

  /**
   * @function getMetrics
   * @description Get current performance metrics
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
