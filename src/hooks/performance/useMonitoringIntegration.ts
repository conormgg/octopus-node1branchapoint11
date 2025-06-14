
/**
 * @fileoverview Integration layer for performance monitoring
 * @description Connects performance monitoring with whiteboard operations,
 * providing automatic instrumentation and reporting capabilities.
 * 
 * @ai-context This hook serves as the bridge between whiteboard operations
 * and performance monitoring, automatically tracking operation performance
 * without requiring manual instrumentation in every component.
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { WhiteboardOperation } from '@/types/sync';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Monitoring integration debug logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[MonitoringIntegration:${context}] ${action}`, data || '');
  }
};

/**
 * @interface MonitoredOperations
 * @description Structure for tracking monitored operations
 */
interface MonitoredOperations {
  drawing: {
    start: () => string;
    end: (operationId: string) => void;
  };
  sync: {
    start: () => string;
    end: (operationId: string) => void;
  };
  render: {
    start: () => string;
    end: (operationId: string) => void;
  };
}

/**
 * @hook useMonitoringIntegration
 * @description Provides automatic performance monitoring integration for whiteboard operations
 * 
 * @param isEnabled - Whether monitoring is enabled
 * 
 * @returns {Object} Monitoring integration interface
 * @returns {MonitoredOperations} operations - Wrapped operations with automatic timing
 * @returns {Function} wrapDrawingOperation - Wrap a drawing function with performance monitoring
 * @returns {Function} wrapSyncOperation - Wrap a sync function with performance monitoring
 * @returns {Function} wrapRenderOperation - Wrap a render function with performance monitoring
 * @returns {Function} monitorOperation - Monitor a specific whiteboard operation
 * @returns {Function} getPerformanceReport - Get current performance report
 * 
 * @ai-understanding
 * This integration:
 * 1. Automatically instruments whiteboard operations
 * 2. Provides wrapped functions that include timing
 * 3. Monitors specific operation types
 * 4. Generates performance reports on demand
 * 5. Can be disabled in production for performance
 */
export const useMonitoringIntegration = (isEnabled: boolean = DEBUG_ENABLED) => {
  debugLog('Hook', 'Initializing monitoring integration', { isEnabled });

  const {
    startTimer,
    endTimer,
    recordDrawingOperation,
    recordSyncOperation,
    recordRenderOperation,
    generateReport,
    metrics
  } = usePerformanceMonitor();

  const operationCounterRef = useRef(0);

  /**
   * @function generateOperationId
   * @description Generate unique operation ID
   * @returns Unique operation identifier
   * 
   * @ai-context Creates unique IDs for tracking individual operations
   * throughout their lifecycle for accurate performance measurement.
   */
  const generateOperationId = useCallback((): string => {
    return `op_${Date.now()}_${++operationCounterRef.current}`;
  }, []);

  /**
   * @function wrapDrawingOperation
   * @description Wrap a drawing function with automatic performance monitoring
   * @param operation - The drawing function to wrap
   * @returns Wrapped function with performance monitoring
   * 
   * @ai-context Creates a wrapper that automatically times drawing operations
   * and records performance metrics without requiring manual instrumentation.
   */
  const wrapDrawingOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T
  ): T => {
    if (!isEnabled) return operation;

    return ((...args: any[]) => {
      const operationId = generateOperationId();
      debugLog('Drawing', 'Starting monitored drawing operation', { operationId });
      
      startTimer(operationId);
      
      try {
        const result = operation(...args);
        
        // Handle both sync and async operations
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = endTimer(operationId);
            recordDrawingOperation(duration);
            debugLog('Drawing', 'Completed async drawing operation', { operationId, duration });
          });
        } else {
          const duration = endTimer(operationId);
          recordDrawingOperation(duration);
          debugLog('Drawing', 'Completed sync drawing operation', { operationId, duration });
          return result;
        }
      } catch (error) {
        const duration = endTimer(operationId);
        recordDrawingOperation(duration);
        debugLog('Drawing', 'Error in drawing operation', { operationId, error });
        throw error;
      }
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordDrawingOperation]);

  /**
   * @function wrapSyncOperation
   * @description Wrap a sync function with automatic performance monitoring
   * @param operation - The sync function to wrap
   * @returns Wrapped function with performance monitoring
   * 
   * @ai-context Creates a wrapper for sync operations that measures
   * real-time collaboration performance and network timing.
   */
  const wrapSyncOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T
  ): T => {
    if (!isEnabled) return operation;

    return ((...args: any[]) => {
      const operationId = generateOperationId();
      debugLog('Sync', 'Starting monitored sync operation', { operationId });
      
      startTimer(operationId);
      
      try {
        const result = operation(...args);
        
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = endTimer(operationId);
            recordSyncOperation(duration);
            debugLog('Sync', 'Completed async sync operation', { operationId, duration });
          });
        } else {
          const duration = endTimer(operationId);
          recordSyncOperation(duration);
          debugLog('Sync', 'Completed sync sync operation', { operationId, duration });
          return result;
        }
      } catch (error) {
        const duration = endTimer(operationId);
        recordSyncOperation(duration);
        debugLog('Sync', 'Error in sync operation', { operationId, error });
        throw error;
      }
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordSyncOperation]);

  /**
   * @function wrapRenderOperation
   * @description Wrap a render function with automatic performance monitoring
   * @param operation - The render function to wrap
   * @returns Wrapped function with performance monitoring
   * 
   * @ai-context Creates a wrapper for render operations that measures
   * canvas rendering performance and frame timing.
   */
  const wrapRenderOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T
  ): T => {
    if (!isEnabled) return operation;

    return ((...args: any[]) => {
      const operationId = generateOperationId();
      
      startTimer(operationId);
      
      try {
        const result = operation(...args);
        
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = endTimer(operationId);
            recordRenderOperation(duration);
          });
        } else {
          const duration = endTimer(operationId);
          recordRenderOperation(duration);
          return result;
        }
      } catch (error) {
        const duration = endTimer(operationId);
        recordRenderOperation(duration);
        debugLog('Render', 'Error in render operation', { operationId, error });
        throw error;
      }
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordRenderOperation]);

  /**
   * @function monitorOperation
   * @description Monitor a specific whiteboard operation
   * @param operation - The whiteboard operation to monitor
   * @param type - The type of operation (drawing, sync, render)
   * 
   * @ai-context Provides specific monitoring for whiteboard operations
   * based on their type, allowing for targeted performance analysis.
   */
  const monitorOperation = useCallback((
    operation: WhiteboardOperation,
    type: 'drawing' | 'sync' | 'render' = 'sync'
  ) => {
    if (!isEnabled) return;

    const operationId = `${type}_${operation.operation_type}_${Date.now()}`;
    debugLog('Operation', `Monitoring ${type} operation`, {
      operationId,
      operationType: operation.operation_type
    });

    startTimer(operationId);
    
    // Monitor the operation processing time
    setTimeout(() => {
      const duration = endTimer(operationId);
      
      switch (type) {
        case 'drawing':
          recordDrawingOperation(duration);
          break;
        case 'sync':
          recordSyncOperation(duration);
          break;
        case 'render':
          recordRenderOperation(duration);
          break;
      }
      
      debugLog('Operation', `Completed ${type} operation monitoring`, {
        operationId,
        duration
      });
    }, 0);
  }, [isEnabled, startTimer, endTimer, recordDrawingOperation, recordSyncOperation, recordRenderOperation]);

  /**
   * @constant operations
   * @description Pre-configured operation monitoring functions
   * 
   * @ai-context Provides convenient access to start/end operation
   * timing for different operation types without manual setup.
   */
  const operations: MonitoredOperations = {
    drawing: {
      start: () => {
        const operationId = generateOperationId();
        startTimer(operationId);
        return operationId;
      },
      end: (operationId: string) => {
        const duration = endTimer(operationId);
        recordDrawingOperation(duration);
      }
    },
    sync: {
      start: () => {
        const operationId = generateOperationId();
        startTimer(operationId);
        return operationId;
      },
      end: (operationId: string) => {
        const duration = endTimer(operationId);
        recordSyncOperation(duration);
      }
    },
    render: {
      start: () => {
        const operationId = generateOperationId();
        startTimer(operationId);
        return operationId;
      },
      end: (operationId: string) => {
        const duration = endTimer(operationId);
        recordRenderOperation(duration);
      }
    }
  };

  /**
   * @function getPerformanceReport
   * @description Get current performance report
   * @returns Performance report with metrics and recommendations
   * 
   * @ai-context Provides external access to performance reports
   * for debugging, optimization, and monitoring dashboards.
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
    operations,
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation,
    monitorOperation,
    getPerformanceReport,
    metrics,
    isEnabled
  };
};
