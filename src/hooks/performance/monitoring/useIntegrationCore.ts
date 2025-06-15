
/**
 * @fileoverview Core integration logic for performance monitoring
 * @description Handles core integration between performance monitoring and application
 */

import { usePerformanceCoordinator } from './usePerformanceCoordinator';
import { useOperationWrappers } from '../useOperationWrappers';
import { useMonitoringTypes } from '../useMonitoringTypes';
import { useMonitoringCore } from '../useMonitoringCore';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

/**
 * @hook useIntegrationCore
 * @description Provides core integration functionality for performance monitoring
 */
export const useIntegrationCore = (isEnabled: boolean) => {
  debugLog('Hook', 'Initializing integration core', { isEnabled });

  const coordinator = usePerformanceCoordinator();

  // Initialize monitoring types and utilities
  const {
    generateOperationId,
    monitorOperation,
    operations
  } = useMonitoringTypes({
    startTimer: coordinator.startTimer,
    endTimer: coordinator.endTimer,
    recordDrawingOperation: coordinator.recordDrawingOperation,
    recordSyncOperation: coordinator.recordSyncOperation,
    recordRenderOperation: coordinator.recordRenderOperation
  });

  // Initialize operation wrappers
  const {
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation
  } = useOperationWrappers({
    isEnabled,
    generateOperationId,
    startTimer: coordinator.startTimer,
    endTimer: coordinator.endTimer,
    recordDrawingOperation: coordinator.recordDrawingOperation,
    recordSyncOperation: coordinator.recordSyncOperation,
    recordRenderOperation: coordinator.recordRenderOperation
  });

  // Initialize core monitoring logic
  const {
    getPerformanceReport
  } = useMonitoringCore({
    isEnabled,
    generateReport: coordinator.generateReport,
    metrics: coordinator.metrics
  });

  return {
    operations,
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation,
    monitorOperation,
    getPerformanceReport,
    metrics: coordinator.metrics,
    isEnabled
  };
};
