
/**
 * @fileoverview Integration layer for performance monitoring
 * @description Connects performance monitoring with whiteboard operations,
 * providing automatic instrumentation and reporting capabilities.
 * 
 * @ai-context This hook serves as the bridge between whiteboard operations
 * and performance monitoring, automatically tracking operation performance
 * without requiring manual instrumentation in every component.
 */

import { usePerformanceMonitor, PerformanceMetrics } from './usePerformanceMonitor';
import { useOperationWrappers } from './useOperationWrappers';
import { useMonitoringTypes } from './useMonitoringTypes';
import { useMonitoringCore } from './useMonitoringCore';
import { createDebugLogger, isDebugEnabled } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

// Feature flag to disable monitoring during critical operations
const DISABLE_MONITORING_DURING_INIT = true;

/**
 * @hook useMonitoringIntegration
 * @description Provides automatic performance monitoring integration for whiteboard operations
 * 
 * @param isEnabled - Whether monitoring is enabled
 * @param isInitializing - Whether the component is currently initializing (disables monitoring)
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
export const useMonitoringIntegration = (
  isEnabled: boolean = isDebugEnabled('performance'),
  isInitializing: boolean = false
) => {
  // Temporarily disable monitoring during initialization to prevent hangs
  const actuallyEnabled = isEnabled && !isInitializing && !DISABLE_MONITORING_DURING_INIT;
  
  debugLog('Hook', 'Initializing monitoring integration', { 
    isEnabled, 
    isInitializing, 
    actuallyEnabled 
  });

  let startTimer, endTimer, recordDrawingOperation, recordSyncOperation, recordRenderOperation, generateReport, metrics;

  try {
    const performanceMonitor = usePerformanceMonitor();
    startTimer = performanceMonitor.startTimer;
    endTimer = performanceMonitor.endTimer;
    recordDrawingOperation = performanceMonitor.recordDrawingOperation;
    recordSyncOperation = performanceMonitor.recordSyncOperation;
    recordRenderOperation = performanceMonitor.recordRenderOperation;
    generateReport = performanceMonitor.generateReport;
    metrics = performanceMonitor.metrics;
  } catch (error) {
    debugLog('Hook', 'Performance monitor initialization failed, creating fallbacks', { error: error.message });
    // Fallback implementations that do nothing
    startTimer = () => {};
    endTimer = () => null;
    recordDrawingOperation = () => {};
    recordSyncOperation = () => {};
    recordRenderOperation = () => {};
    generateReport = () => ({ warnings: [], recommendations: [], timestamp: Date.now() });
    metrics = {
      drawingOperations: { count: 0, totalTime: 0, averageTime: 0, lastOperationTime: 0 },
      syncOperations: { count: 0, totalTime: 0, averageTime: 0, lastSyncTime: 0 },
      renderOperations: { count: 0, totalTime: 0, averageTime: 0, fps: 60 },
      memoryUsage: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 }
    };
  }

  let generateOperationId, monitorOperation, operations;

  try {
    // Initialize monitoring types and utilities
    const monitoringTypes = useMonitoringTypes({
      startTimer,
      endTimer,
      recordDrawingOperation,
      recordSyncOperation,
      recordRenderOperation
    });
    generateOperationId = monitoringTypes.generateOperationId;
    monitorOperation = monitoringTypes.monitorOperation;
    operations = monitoringTypes.operations;
  } catch (error) {
    debugLog('Hook', 'Monitoring types initialization failed, creating fallbacks', { error: error.message });
    generateOperationId = () => `fallback_${Date.now()}`;
    monitorOperation = (fn) => fn;
    operations = {
      drawing: { start: () => {}, continue: () => {}, end: () => {} },
      sync: { send: () => {}, receive: () => {} },
      render: { draw: () => {}, update: () => {} }
    };
  }

  let wrapDrawingOperation, wrapSyncOperation, wrapRenderOperation;

  try {
    // Initialize operation wrappers
    const operationWrappers = useOperationWrappers({
      isEnabled: actuallyEnabled,
      generateOperationId,
      startTimer,
      endTimer,
      recordDrawingOperation,
      recordSyncOperation,
      recordRenderOperation
    });
    wrapDrawingOperation = operationWrappers.wrapDrawingOperation;
    wrapSyncOperation = operationWrappers.wrapSyncOperation;
    wrapRenderOperation = operationWrappers.wrapRenderOperation;
  } catch (error) {
    debugLog('Hook', 'Operation wrappers initialization failed, creating fallbacks', { error: error.message });
    // Fallback wrappers that just return the original function
    wrapDrawingOperation = (fn) => fn;
    wrapSyncOperation = (fn) => fn;
    wrapRenderOperation = (fn) => fn;
  }

  let getPerformanceReport;

  try {
    // Initialize core monitoring logic
    const monitoringCore = useMonitoringCore({
      isEnabled: actuallyEnabled,
      generateReport,
      metrics
    });
    getPerformanceReport = monitoringCore.getPerformanceReport;
  } catch (error) {
    debugLog('Hook', 'Monitoring core initialization failed, creating fallback', { error: error.message });
    getPerformanceReport = () => null;
  }

  return {
    operations,
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation,
    monitorOperation,
    getPerformanceReport,
    metrics,
    isEnabled: actuallyEnabled
  };
};

// Export types for external use
export type { PerformanceMetrics };
