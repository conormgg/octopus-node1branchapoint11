
/**
 * @fileoverview Integration layer for performance monitoring
 * @description Connects performance monitoring with whiteboard operations,
 * providing automatic instrumentation and reporting capabilities.
 * 
 * @ai-context This hook serves as the bridge between whiteboard operations
 * and performance monitoring, automatically tracking operation performance
 * without requiring manual instrumentation in every component.
 */

import { usePerformanceMonitor } from './usePerformanceMonitor';
import { useOperationWrappers } from './useOperationWrappers';
import { useMonitoringTypes } from './useMonitoringTypes';
import { useMonitoringCore } from './useMonitoringCore';
import { createDebugLogger, isDebugEnabled } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

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
export const useMonitoringIntegration = (isEnabled: boolean = isDebugEnabled('performance')) => {
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

  // Initialize monitoring types and utilities
  const {
    generateOperationId,
    monitorOperation,
    operations
  } = useMonitoringTypes({
    startTimer,
    endTimer,
    recordDrawingOperation,
    recordSyncOperation,
    recordRenderOperation
  });

  // Initialize operation wrappers
  const {
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation
  } = useOperationWrappers({
    isEnabled,
    generateOperationId,
    startTimer,
    endTimer,
    recordDrawingOperation,
    recordSyncOperation,
    recordRenderOperation
  });

  // Initialize core monitoring logic
  const {
    getPerformanceReport
  } = useMonitoringCore({
    isEnabled,
    generateReport,
    metrics
  });

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
